import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    handle: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

blockSchema.index({ userId: 1, handle: 1 }, { unique: true });

export const Block = mongoose.model("Block", blockSchema);
