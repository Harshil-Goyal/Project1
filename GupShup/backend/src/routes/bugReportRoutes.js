import { Router } from "express";
import { createBugReport, listBugReports, removeBugReport, resolveBugReport } from "../controllers/bugReportController.js";

const router = Router();

router.get("/", listBugReports);
router.post("/", createBugReport);
router.patch("/:id/resolve", resolveBugReport);
router.delete("/:id", removeBugReport);

export default router;
