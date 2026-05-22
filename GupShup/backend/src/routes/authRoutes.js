import { Router } from "express";
import { changePassword, getMe, login, logout, refresh, register, googleAuth } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);
router.post("/change-password", requireAuth, changePassword);

export default router;
