import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contactKey: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    handle: {
      type: String,
      required: true,
      trim: true,
    },
    preview: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "Now",
    },
    kind: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },
    unread: {
      type: Boolean,
      default: false,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ userId: 1, contactKey: 1 }, { unique: true });

export const Conversation = mongoose.model("Conversation", conversationSchema);
