import { Router } from "express";
import {
  createPost,
  deletePost,
  getChatContacts,
  getChatMessages,
  getFeedPosts,
  getNotifications,
  getRightPanelNews,
  getSettingsCategories,
  getSuggestedUsers,
  getTrendItems,
  updatePost,
} from "../controllers/contentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/feed-posts", getFeedPosts);
router.get("/trends", getTrendItems);
router.get("/notifications", requireAuth, getNotifications);
router.get("/chat-contacts", getChatContacts);
router.get("/chat-messages", getChatMessages);
router.get("/settings-categories", getSettingsCategories);
router.get("/right-panel-news", getRightPanelNews);
router.get("/suggested-users", requireAuth, getSuggestedUsers);
router.post("/feed-posts", requireAuth, createPost);
router.patch("/feed-posts/:postId", requireAuth, updatePost);
router.delete("/feed-posts/:postId", requireAuth, deletePost);

export default router;
