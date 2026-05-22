import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    handle: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    handle: {
      type: String,
      required: true,
    },
    feed: {
      type: String,
      enum: ["for-you", "following"],
      default: "for-you",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 280,
    },
    image: {
      type: String,
      default: null,
    },
    video: {
      type: String,
      default: null,
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    stats: {
      comments: { type: Number, default: 0 },
      reposts: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model("Post", postSchema);
