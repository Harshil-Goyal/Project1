import { BugReport } from "../models/BugReport.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

function serializeBugReport(report) {
  return {
    id: report.id,
    email: report.email,
    title: report.title,
    details: report.details,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

export const listBugReports = asyncHandler(async (_req, res) => {
  const reports = await BugReport.find().sort({ createdAt: -1 });
  res.json(reports.map(serializeBugReport));
});

export const createBugReport = asyncHandler(async (req, res) => {
  const { email, title, details } = req.body;
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanTitle = String(title || "").trim();
  const cleanDetails = String(details || "").trim();

  if (!cleanEmail || !cleanTitle || !cleanDetails) {
    throw new AppError("Fill the required fields", 400);
  }

  if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
    throw new AppError("Incorrect credential", 400);
  }

  const report = await BugReport.create({
    email: cleanEmail,
    title: cleanTitle,
    details: cleanDetails,
  });

  res.status(201).json(serializeBugReport(report));
});

export const resolveBugReport = asyncHandler(async (req, res) => {
  const report = await BugReport.findById(req.params.id);
  if (!report) {
    throw new AppError("Bug report not found", 404);
  }

  report.status = "resolved";
  await report.save();
  res.json(serializeBugReport(report));
});

export const removeBugReport = asyncHandler(async (req, res) => {
  const report = await BugReport.findById(req.params.id);
  if (!report) {
    throw new AppError("Bug report not found", 404);
  }

  await report.deleteOne();
  res.json({ message: "Bug report deleted successfully" });
});
