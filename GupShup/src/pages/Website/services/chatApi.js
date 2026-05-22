import { apiClient } from "../../../lib/apiClient";

export function fetchConversations() {
  return apiClient.get("/chat/conversations");
}

export function fetchConversationMessages(conversationId) {
  return apiClient.get(`/chat/conversations/${conversationId}/messages`);
}

export function sendConversationMessage(conversationId, payload) {
  return apiClient.post(`/chat/conversations/${conversationId}/messages`, payload);
}

export function clearConversationHistory(conversationId) {
  return apiClient.post(`/chat/conversations/${conversationId}/clear`, {});
}

export function deleteConversationById(conversationId) {
  return apiClient.delete(`/chat/conversations/${conversationId}`);
}

export function toggleConversationBlockState(conversationId) {
  return apiClient.post(`/chat/conversations/${conversationId}/block`, {});
}

export function markConversationAsRead(conversationId) {
  return apiClient.post(`/chat/conversations/${conversationId}/read`, {});
}

export function markAllConversationsAsRead() {
  return apiClient.post("/chat/conversations/read-all", {});
}
