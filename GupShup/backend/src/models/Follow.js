import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    suggestedUserId: {
      type: String,
      default: "",
      trim: true,
    },
    handle: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

followSchema.index({ userId: 1, suggestedUserId: 1 }, { unique: true, partialFilterExpression: { suggestedUserId: { $type: "string", $ne: "" } } });
followSchema.index({ userId: 1, handle: 1 }, { unique: true, partialFilterExpression: { handle: { $type: "string", $ne: "" } } });

export const Follow = mongoose.model("Follow", followSchema);
