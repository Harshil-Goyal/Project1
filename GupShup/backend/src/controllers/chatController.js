import { Follow } from "../models/Follow.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { getSocketServer } from "../utils/socket.js";
import { uploadMediaIfNeeded } from "../utils/uploadMedia.js";

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function serializeConversation(conversation) {
  return {
    id: conversation.id,
    name: conversation.name,
    handle: conversation.handle,
    preview: conversation.preview || "Start a conversation",
    time: conversation.time || "Now",
    kind: conversation.kind,
    unread: Boolean(conversation.unread),
    blocked: Boolean(conversation.blocked),
    // expose the other party's DB id so the frontend can use it for calls
    userId: conversation.contactKey || "",
  };
}

function serializeMessage(message) {
  return {
    id: String(message.id || message._id),
    from: message.from,
    text: message.text || "",
    time: message.time || formatTime(message.createdAt ? new Date(message.createdAt) : new Date()),
    mediaUrl: message.mediaUrl || "",
    mediaType: message.mediaType || "",
  };
}

async function loadConversationForUser(userId, conversationId) {
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  return conversation;
}

export const listConversations = asyncHandler(async (req, res) => {
  // Find users this person follows
  const follows = await Follow.find({ userId: req.user.id }).lean();
  
  // Auto-create conversations for any followed user if one doesn't exist
  for (const follow of follows) {
    try {
      const contactKey = follow.suggestedUserId || follow.handle;
      if (!contactKey) continue;
      
      // Try to find if a conversation already exists using EITHER the ID or the handle
      const exists = await Conversation.findOne({ 
        userId: req.user.id, 
        $or: [
          { contactKey: String(contactKey) },
          ...(follow.handle ? [{ contactKey: follow.handle }] : []),
          ...(follow.suggestedUserId ? [{ contactKey: String(follow.suggestedUserId) }] : [])
        ]
      });

      if (!exists) {
        let contactUser = null;
        if (follow.suggestedUserId) {
          contactUser = await User.findById(follow.suggestedUserId);
        } else if (follow.handle) {
          const cleanHandle = follow.handle.replace(/^@/, "");
          contactUser = await User.findOne({ username: cleanHandle });
        }

        if (contactUser) {
          await Conversation.create({
            userId: req.user.id,
            contactKey: String(contactUser._id),
            name: contactUser.name || "GupShup User",
            handle: contactUser.username ? `@${contactUser.username}` : (follow.handle || "@user"),
            preview: "Start a conversation",
            time: "Now",
            kind: "direct",
            unread: false
          });
        } else if (follow.handle) {
          // Fallback for when user doesn't exist in DB yet but we have the handle
          await Conversation.create({
            userId: req.user.id,
            contactKey: follow.handle,
            name: follow.name || follow.handle,
            handle: follow.handle,
            preview: "Start a conversation",
            time: "Now",
            kind: "direct",
            unread: false
          });
        }
      }
    } catch (err) {
      console.error("Error creating auto-conversation:", err);
      // Continue to next follow instead of crashing the whole request
    }
  }

  const conversations = await Conversation.find({
    userId: req.user.id,
    deleted: false,
  }).sort({ updatedAt: -1 }).lean();

  res.json(conversations.map((c) => ({
    ...serializeConversation(c),
    id: String(c._id) // Ensure ID is a string for the frontend
  })));
});

export const listMessages = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForUser(req.user.id, req.params.conversationId);
  const messages = await Message.find({ conversationId: conversation.id }).sort({ createdAt: 1 }).lean();
  res.json(messages.map(serializeMessage));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForUser(req.user.id, req.params.conversationId);
  if (conversation.blocked) {
    throw new AppError("This conversation is blocked", 403);
  }

  const text = String(req.body.text || "").trim();
  const mediaUrl = String(req.body.mediaUrl || "");
  const mediaType = String(req.body.mediaType || "");

  if (!text && !mediaUrl) {
    throw new AppError("Message text or media is required", 400);
  }

  const uploadedMediaUrl = await uploadMediaIfNeeded(
    mediaUrl,
    mediaType,
    "gupshup/chat"
  );

  const now = new Date();
  const message = await Message.create({
    conversationId: conversation.id,
    from: "me",
    text,
    time: formatTime(now),
    mediaUrl: uploadedMediaUrl,
    mediaType,
  });

  conversation.preview = text || (mediaType === "video" ? "Sent a video" : "Sent an image");
  conversation.time = "Now";
  conversation.unread = false;
  await conversation.save();

  const payload = serializeMessage(message);
  const io = getSocketServer();
  
  // 1. Emit to the sender's room (for their other tabs)
  io?.to(`conversation:${conversation.id}`).emit("chat:message", {
    conversationId: conversation.id,
    message: payload,
  });

  // 2. Try to find the receiver's conversation and emit to it
  let receiverUserId = conversation.contactKey;
  
  // If contactKey is a handle, resolve it to an ID
  if (String(receiverUserId).startsWith("@")) {
    const cleanHandle = String(receiverUserId).replace(/^@/, "");
    const targetUser = await User.findOne({ username: cleanHandle });
    if (targetUser) receiverUserId = String(targetUser._id);
  }

  let otherConversation = await Conversation.findOne({
    userId: receiverUserId,
    contactKey: String(req.user.id),
  });

  if (!otherConversation && receiverUserId) {
    // Create conversation for the receiver if they don't have one
    otherConversation = await Conversation.create({
      userId: receiverUserId,
      contactKey: String(req.user.id),
      name: req.user.name || "GupShup User",
      handle: `@${req.user.username || "user"}`,
      preview: "Start a conversation",
      time: "Now",
      kind: "direct",
      unread: true
    });
  }

  if (otherConversation) {
    // Save a copy of the message in the receiver's conversation (from their perspective: 'them')
    await Message.create({
      conversationId: otherConversation.id,
      from: "them",
      text,
      time: formatTime(now),
      mediaUrl: uploadedMediaUrl,
      mediaType,
    });

    // Emit real-time notification to receiver
    const receiverPayload = { ...payload, from: "them" };
    io?.to(`conversation:${otherConversation.id}`).emit("chat:message", {
      conversationId: otherConversation.id,
      message: receiverPayload,
    });

    // Update receiver's preview and unread status
    otherConversation.preview = text || (mediaType === "video" ? "Sent a video" : mediaType === "audio" ? "Voice message" : "Sent an image");
    otherConversation.time = "Now";
    otherConversation.unread = true;
    await otherConversation.save();
  }

  res.status(201).json(payload);
});

export const clearConversation = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForUser(req.user.id, req.params.conversationId);
  await Message.deleteMany({ conversationId: conversation.id });
  conversation.preview = "Chat cleared";
  conversation.time = "Now";
  await conversation.save();
  res.json({ message: "Chat cleared" });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForUser(req.user.id, req.params.conversationId);
  conversation.deleted = true;
  await conversation.save();
  res.json({ message: "Chat deleted" });
});

export const toggleConversationBlock = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForUser(req.user.id, req.params.conversationId);
  conversation.blocked = !conversation.blocked;
  await conversation.save();
  res.json({ blocked: conversation.blocked });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await loadConversationForUser(req.user.id, req.params.conversationId);
  conversation.unread = false;
  await conversation.save();
  res.json({ ok: true });
});

export const markAllConversationsRead = asyncHandler(async (req, res) => {
  await Conversation.updateMany({ userId: req.user.id, deleted: false }, { unread: false });
  res.json({ ok: true });
});
