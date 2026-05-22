import { apiClient } from "../../../lib/apiClient";

export function fetchFeedPosts() {
  return apiClient.get("/content/feed-posts");
}

export function fetchTrendingPosts() {
  return apiClient.get("/social/posts/trending");
}

export function fetchTrendItems() {
  return apiClient.get("/content/trends");
}

export function fetchNotifications() {
  return apiClient.get("/content/notifications");
}

export function fetchChatContacts() {
  return apiClient.get("/content/chat-contacts");
}

export function fetchChatMessages() {
  return apiClient.get("/content/chat-messages");
}

export function fetchSettingsCategories() {
  return apiClient.get("/content/settings-categories");
}

export function fetchRightPanelNews() {
  return apiClient.get("/content/right-panel-news");
}

export function fetchSuggestedUsers() {
  return apiClient.get("/content/suggested-users");
}
