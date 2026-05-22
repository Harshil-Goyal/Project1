import { Report } from "../models/Report.js";
import { Notification } from "../models/Notification.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const reportPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const reason = String(req.body.reason || "Reported from feed actions").trim();
  const handle = String(req.body.handle || "").trim();

  if (!postId) {
    throw new AppError("Post id is required", 400);
  }

  const existing = await Report.findOne({ userId: req.user.id, postId });
  if (existing) {
    return res.json({ message: "Post already reported", alreadyReported: true });
  }

  await Report.create({
    userId: req.user.id,
    postId,
    handle,
    reason,
  });

  await Notification.create({
    userId: req.user.id,
    type: "report",
    message: "Your report has been submitted",
    time: "now",
  });

  res.status(201).json({ message: "Post reported successfully" });
});
