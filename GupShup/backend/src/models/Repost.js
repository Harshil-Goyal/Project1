import mongoose from "mongoose";

const repostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postId: {
      type: String,
      required: true,
      index: true,
    },
    postSnapshot: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

repostSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Repost = mongoose.model("Repost", repostSchema);
