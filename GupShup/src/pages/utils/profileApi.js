import { apiClient } from "../../lib/apiClient";

export function completeUserProfile(payload) {
  return apiClient.post("/profile/complete", payload);
}

export function updateUserProfile(payload) {
  return apiClient.patch("/profile/me", payload);
}
