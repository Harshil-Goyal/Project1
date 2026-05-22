import { Router } from "express";
import { reportPost } from "../controllers/reportController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.post("/posts/:postId", reportPost);

export default router;
