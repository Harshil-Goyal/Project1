import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
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
    handle: {
      type: String,
      default: "",
      trim: true,
    },
    reason: {
      type: String,
      default: "Reported from feed actions",
      trim: true,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ["open", "reviewed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const Report = mongoose.model("Report", reportSchema);
