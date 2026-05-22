import { Router } from "express";
import { completeProfile, updateProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.post("/complete", completeProfile);
router.patch("/me", updateProfile);

export default router;
