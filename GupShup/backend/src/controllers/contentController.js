import { User } from "../models/User.js";
import { Follow } from "../models/Follow.js";
import { Comment } from "../models/Comment.js";
import { Notification } from "../models/Notification.js";
import { Post } from "../models/Post.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { uploadMediaIfNeeded } from "../utils/uploadMedia.js";

function serializePost(post) {
  const createdAt = new Date(post.createdAt);
  const ageMinutes = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));
  return {
    id: String(post.id || post._id),
    author: post.author,
    handle: post.handle,
    ageMinutes,
    feed: post.feed,
    verified: post.verified,
    avatar: post.avatar,
    text: post.text || "",
    image: post.image || null,
    video: post.video || null,
    comments: post.comments || [],
    stats: {
      comments: post.stats?.comments || 0,
      reposts: post.stats?.reposts || 0,
      likes: post.stats?.likes || 0,
      bookmarks: post.stats?.bookmarks || 0,
      shares: post.stats?.shares || 0,
    },
  };
}

export const getFeedPosts = asyncHandler(async (_req, res) => {
  const dynamicPosts = await Post.find().sort({ createdAt: -1 }).lean();
  const commentCounts = await Comment.aggregate([
    { $match: { postId: { $in: dynamicPosts.map((post) => String(post._id)) } } },
    { $group: { _id: "$postId", count: { $sum: 1 } } },
  ]);
  const commentCountMap = commentCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
  const serializedDynamicPosts = dynamicPosts.map((post) => {
    const serialized = serializePost(post);
    serialized.stats.comments += commentCountMap[serialized.id] || 0;
    return serialized;
  });
  res.json(serializedDynamicPosts);
});

export const createPost = asyncHandler(async (req, res) => {
  const { text, mediaUrl, mediaType } = req.body;
  const trimmedText = String(text || "").trim();
  const normalizedMediaType = mediaType === "video" ? "video" : mediaType === "image" ? "image" : "";

  if (!trimmedText && !mediaUrl) {
    throw new AppError("Post text or media is required", 400);
  }

  const uploadedMediaUrl = await uploadMediaIfNeeded(
    mediaUrl,
    normalizedMediaType,
    "gupshup/posts"
  );

  const username = req.user.username || "user";
  const post = await Post.create({
    authorId: req.user.id,
    author: req.user.name,
    handle: `@${username}`,
    feed: "for-you",
    verified: req.user.role === "admin",
    avatar: `https://picsum.photos/seed/${encodeURIComponent(username)}/120/120`,
    text: trimmedText,
    image: normalizedMediaType === "image" ? uploadedMediaUrl : null,
    video: normalizedMediaType === "video" ? uploadedMediaUrl : null,
    comments: [],
    stats: {
      comments: 0,
      reposts: 0,
      likes: 0,
      bookmarks: 0,
      shares: 0,
    },
  });

  res.status(201).json(serializePost(post));
});

export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const text = String(req.body.text || "").trim();
  if (!text) {
    throw new AppError("Post text is required", 400);
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError("Post not found", 404);
  }
  if (String(post.authorId) !== String(req.user.id)) {
    throw new AppError("You can only edit your own posts", 403);
  }

  post.text = text;
  await post.save();
  res.json(serializePost(post));
});

export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError("Post not found", 404);
  }
  if (String(post.authorId) !== String(req.user.id)) {
    throw new AppError("You can only delete your own posts", 403);
  }

  await post.deleteOne();
  res.json({ message: "Post deleted successfully", postId });
});

export const getTrendItems = asyncHandler(async (_req, res) => {
  res.json([
    { id: "t1", topic: "Frontend Architecture", posts: "12.8K posts" },
    { id: "t2", topic: "Vite + React UI", posts: "8,120 posts" },
    { id: "t3", topic: "Design Systems", posts: "6,402 posts" },
  ]);
});

export const getNotifications = asyncHandler(async (req, res) => {
  const storedNotifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json(
    storedNotifications.map((item) => ({
      id: String(item.id || item._id),
      type: item.type,
      message: item.message,
      time: item.time,
    }))
  );
});

export const getChatContacts = asyncHandler(async (_req, res) => {
  res.json([]);
});

export const getChatMessages = asyncHandler(async (_req, res) => {
  res.json([]);
});

export const getSettingsCategories = asyncHandler(async (_req, res) => {
  res.json([
    "Account Information",
    "Password and security",
    "Account privacy",
    "Notifications",
    "Accessibility and display",
    "Help Center",
  ]);
});

export const getRightPanelNews = asyncHandler(async (_req, res) => {
  res.json([
    "AI-Powered Creator Tools Gain Adoption Across Social Platforms",
    "New Chat Safety Controls Announced for Consumer Apps",
  ]);
});

export const getSuggestedUsers = asyncHandler(async (req, res) => {
  const MAX_SUGGESTIONS = 8;

  // Find users the current user already follows
  const follows = await Follow.find({ userId: req.user.id }).select("suggestedUserId").lean();
  const followedUserIds = follows.map((f) => f.suggestedUserId).filter(Boolean);

  // Count how many times each user is followed (follower count) — all users
  const followerCounts = await Follow.aggregate([
    { $match: { suggestedUserId: { $exists: true, $ne: "" } } },
    { $group: { _id: "$suggestedUserId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ]);

  // Build a map: userId -> followerCount
  const followerCountMap = {};
  followerCounts.forEach((item) => {
    followerCountMap[item._id] = item.count;
  });

  // IDs sorted by follower count, excluding already-followed and self
  const sortedIds = followerCounts
    .map((item) => item._id)
    .filter((id) => id !== String(req.user.id) && !followedUserIds.includes(id));

  // Fetch those users
  const suggested = await User.find({ _id: { $in: sortedIds } })
    .select("name username bio avatarUrl")
    .lean();

  // Sort by the follower count order
  const sorted = sortedIds
    .map((id) => suggested.find((u) => String(u._id) === id))
    .filter(Boolean)
    .slice(0, MAX_SUGGESTIONS);

  // Fill remaining slots with any other users (fallback)
  if (sorted.length < MAX_SUGGESTIONS) {
    const excludedIds = [
      ...sortedIds.map((id) => id),
      String(req.user.id),
      ...followedUserIds,
    ];
    const fallbackUsers = await User.find({
      _id: { $nin: excludedIds },
    })
      .select("name username bio avatarUrl")
      .limit(MAX_SUGGESTIONS - sorted.length)
      .lean();

    sorted.push(...fallbackUsers);
  }

  res.json(
    sorted.map((u) => ({
      id: String(u._id),
      name: u.name,
      handle: `@${u.username || "user"}`,
      bio: u.bio || "",
      avatarUrl: u.avatarUrl || `https://picsum.photos/seed/${u.username}/120/120`,
      followersCount: followerCountMap[String(u._id)] || 0,
    }))
  );
});

export const getTrendingPosts = asyncHandler(async (_req, res) => {
  const posts = await Post.find().sort({ "stats.likes": -1, "stats.reposts": -1 }).limit(20).lean();
  res.json(posts.map(serializePost));
});
