import { Router } from "express";
import { clearConversation, deleteConversation, listConversations, listMessages, markAllConversationsRead, markConversationRead, sendMessage, toggleConversationBlock } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/conversations", listConversations);
router.get("/conversations/:conversationId/messages", listMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.post("/conversations/:conversationId/clear", clearConversation);
router.delete("/conversations/:conversationId", deleteConversation);
router.post("/conversations/:conversationId/block", toggleConversationBlock);
router.post("/conversations/:conversationId/read", markConversationRead);
router.post("/conversations/read-all", markAllConversationsRead);

export default router;
