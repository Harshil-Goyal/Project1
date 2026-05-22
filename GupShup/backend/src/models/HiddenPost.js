import mongoose from "mongoose";

const hiddenPostSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

hiddenPostSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const HiddenPost = mongoose.model("HiddenPost", hiddenPostSchema);
