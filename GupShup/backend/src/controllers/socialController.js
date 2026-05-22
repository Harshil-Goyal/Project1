import { Bookmark } from "../models/Bookmark.js";
import { Block } from "../models/Block.js";
import { Comment } from "../models/Comment.js";
import { Follow } from "../models/Follow.js";
import { HiddenPost } from "../models/HiddenPost.js";
import { Like } from "../models/Like.js";
import { Notification } from "../models/Notification.js";
import { Repost } from "../models/Repost.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

function normalizeHandle(handle) {
  const value = String(handle || "").trim().toLowerCase();
  if (!value) return "";
  return value.startsWith("@") ? value : `@${value}`;
}

function serializeComment(comment) {
  return {
    id: String(comment.id || comment._id),
    author: comment.author,
    handle: comment.handle,
    text: comment.text,
  };
}

async function createNotification(userId, type, message, time = "now") {
  await Notification.create({
    userId,
    type,
    message,
    time,
  });
}

export const getSocialState = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    likes,
    bookmarks,
    reposts,
    comments,
    follows,
    followers,
    hiddenPosts,
    blocks,
    notifications,
  ] = await Promise.all([
    Like.find({ userId }).lean(),
    Bookmark.find({ userId }).lean(),
    Repost.find({ userId }).sort({ createdAt: -1 }).lean(),
    Comment.find({ userId }).sort({ createdAt: 1 }).lean(),
    Follow.find({ userId }).lean(),
    Follow.find({
      $or: [
        { suggestedUserId: String(userId) },
        ...(req.user.username ? [{ handle: { $regex: new RegExp(`^@${req.user.username}$`, "i") } }] : [])
      ]
    }).lean(),
    HiddenPost.find({ userId }).lean(),
    Block.find({ userId }).lean(),
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const commentsByPost = comments.reduce((acc, comment) => {
    const key = comment.postId;
    acc[key] = [...(acc[key] || []), serializeComment(comment)];
    return acc;
  }, {});

  res.json({
    likedPostIds: likes.map((item) => item.postId),
    bookmarkedPostIds: bookmarks.map((item) => item.postId),
    repostedPosts: reposts.map((item) => ({
      ...item.postSnapshot,
      repostedAt: item.createdAt,
    })),
    commentsByPost,
    hiddenPostIds: hiddenPosts.map((item) => item.postId),
    blockedHandles: blocks.map((item) => item.handle),
    followedHandles: follows.map((item) => item.handle).filter(Boolean),
    followedUserIds: follows.map((item) => item.suggestedUserId).filter(Boolean),
    followingCount: follows.length,
    followers: [...new Set(followers.map((item) => String(item.userId)))],
    followersCount: [...new Set(followers.map((item) => String(item.userId)))].length,
    notifications: notifications.map((item) => ({
      id: String(item.id || item._id),
      type: item.type,
      message: item.message,
      time: item.time,
    })),
  });
});

export const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const existing = await Like.findOne({ userId: req.user.id, postId });

  if (existing) {
    await existing.deleteOne();
    return res.json({ active: false, postId });
  }

  await Like.create({ userId: req.user.id, postId });
  await createNotification(req.user.id, "like", "You liked a post", "now");
  res.json({ active: true, postId });
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const existing = await Bookmark.findOne({ userId: req.user.id, postId });

  if (existing) {
    await existing.deleteOne();
    return res.json({ active: false, postId });
  }

  await Bookmark.create({ userId: req.user.id, postId });
  res.json({ active: true, postId });
});

export const toggleRepost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { post } = req.body;
  const existing = await Repost.findOne({ userId: req.user.id, postId });

  if (existing) {
    await existing.deleteOne();
    return res.json({ active: false, postId });
  }

  if (!post || typeof post !== "object") {
    throw new AppError("Post snapshot is required", 400);
  }

  await Repost.create({
    userId: req.user.id,
    postId,
    postSnapshot: post,
  });
  await createNotification(req.user.id, "repost", "You reposted a post", "now");
  res.json({ active: true, postId });
});

export const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const text = String(req.body.text || "").trim();

  if (!text) {
    throw new AppError("Comment text is required", 400);
  }

  const comment = await Comment.create({
    userId: req.user.id,
    postId,
    author: req.user.name,
    handle: `@${req.user.username || "user"}`,
    text,
  });

  await createNotification(req.user.id, "comment", "Your reply was posted", "now");

  res.status(201).json(serializeComment(comment));
});

export const hidePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const existing = await HiddenPost.findOne({ userId: req.user.id, postId });
  if (!existing) {
    await HiddenPost.create({ userId: req.user.id, postId });
  }
  res.json({ postId, hidden: true });
});

export const toggleBlockHandle = asyncHandler(async (req, res) => {
  const handle = normalizeHandle(req.body.handle);
  if (!handle) {
    throw new AppError("Handle is required", 400);
  }

  const existing = await Block.findOne({ userId: req.user.id, handle });
  if (existing) {
    await existing.deleteOne();
    return res.json({ handle, blocked: false });
  }

  await Block.create({ userId: req.user.id, handle });
  await Follow.deleteMany({ userId: req.user.id, handle });
  res.json({ handle, blocked: true });
});

export const toggleFollowHandle = asyncHandler(async (req, res) => {
  const handle = normalizeHandle(req.body.handle);
  const name = String(req.body.name || "").trim();
  if (!handle) {
    throw new AppError("Handle is required", 400);
  }

  const existing = await Follow.findOne({ userId: req.user.id, handle });
  if (existing) {
    await existing.deleteOne();
    return res.json({ handle, active: false });
  }

  // Try to find the user to get their ID
  const cleanHandle = handle.replace(/^@/, "");
  const targetUser = await User.findOne({ username: cleanHandle });

  await Follow.create({ 
    userId: req.user.id, 
    handle, 
    name,
    suggestedUserId: targetUser ? String(targetUser._id) : undefined 
  });
  await createNotification(req.user.id, "follow", `You followed ${handle}`, "now");
  res.json({ handle, active: true });
});

export const toggleFollowSuggested = asyncHandler(async (req, res) => {
  const suggestedUserId = String(req.body.suggestedUserId || "").trim();
  const handle = normalizeHandle(req.body.handle);
  const name = String(req.body.name || "").trim();

  if (!suggestedUserId) {
    throw new AppError("Suggested user id is required", 400);
  }

  const existing = await Follow.findOne({ userId: req.user.id, suggestedUserId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ suggestedUserId, active: false });
  }

  await Follow.create({ userId: req.user.id, suggestedUserId, handle, name });
  await createNotification(req.user.id, "follow", `You followed ${name || handle || "a user"}`, "now");
  res.json({ suggestedUserId, active: true });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (!query) return res.json([]);

  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
    ],
  }).limit(20).lean();

  res.json(users.map(u => ({
    id: String(u._id),
    name: u.name,
    handle: `@${u.username}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
  })));
});
