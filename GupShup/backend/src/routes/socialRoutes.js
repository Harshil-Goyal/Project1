import { Router } from "express";
import { addComment, getSocialState, hidePost, searchUsers, toggleBlockHandle, toggleBookmark, toggleFollowHandle, toggleFollowSuggested, toggleLike, toggleRepost } from "../controllers/socialController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getTrendingPosts } from "../controllers/contentController.js";

const router = Router();

router.use(requireAuth);
router.get("/state", getSocialState);
router.get("/users/search", searchUsers);
router.get("/posts/trending", getTrendingPosts);
router.post("/posts/:postId/like", toggleLike);
router.post("/posts/:postId/bookmark", toggleBookmark);
router.post("/posts/:postId/repost", toggleRepost);
router.post("/posts/:postId/comments", addComment);
router.post("/posts/:postId/hide", hidePost);
router.post("/block-handle", toggleBlockHandle);
router.post("/follow-handle", toggleFollowHandle);
router.post("/follow-suggested", toggleFollowSuggested);

export default router;
