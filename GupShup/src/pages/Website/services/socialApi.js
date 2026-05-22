import { apiClient } from "../../../lib/apiClient";

export function fetchSocialState() {
  return apiClient.get("/social/state");
}

export function togglePostLike(postId) {
  return apiClient.post(`/social/posts/${postId}/like`, {});
}

export function togglePostBookmark(postId) {
  return apiClient.post(`/social/posts/${postId}/bookmark`, {});
}

export function togglePostRepost(postId, post) {
  return apiClient.post(`/social/posts/${postId}/repost`, { post });
}

export function addPostComment(postId, text) {
  return apiClient.post(`/social/posts/${postId}/comments`, { text });
}

export function hideFeedPost(postId) {
  return apiClient.post(`/social/posts/${postId}/hide`, {});
}

export function toggleHandleBlock(handle) {
  return apiClient.post("/social/block-handle", { handle });
}

export function toggleHandleFollow(handle, name = "") {
  return apiClient.post("/social/follow-handle", { handle, name });
}

export function toggleSuggestedFollow(suggestedUserId, handle, name) {
  return apiClient.post("/social/follow-suggested", {
    suggestedUserId,
    handle,
    name,
  });
}

export function searchUsers(query) {
  return apiClient.get(`/social/users/search?q=${encodeURIComponent(query)}`);
}
