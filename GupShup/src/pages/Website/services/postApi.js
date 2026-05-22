import { apiClient } from "../../../lib/apiClient";

export function createFeedPost(payload) {
  return apiClient.post("/content/feed-posts", payload);
}

export function updateFeedPost(postId, text) {
  return apiClient.patch(`/content/feed-posts/${postId}`, { text });
}

export function deleteFeedPost(postId) {
  return apiClient.delete(`/content/feed-posts/${postId}`);
}
