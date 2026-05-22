import { apiClient } from "../../../lib/apiClient";

export function reportFeedPost(postId, payload) {
  return apiClient.post(`/reports/posts/${postId}`, payload);
}
