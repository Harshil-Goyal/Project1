import { apiClient } from "../../lib/apiClient";

export function registerUser(payload) {
  return apiClient.post("/auth/register", payload);
}

export function loginUser(payload) {
  return apiClient.post("/auth/login", payload);
}

export function googleLoginUser(idToken) {
  return apiClient.post("/auth/google", { idToken });
}

export function getCurrentUser() {
  return apiClient.get("/auth/me");
}

export function logoutUser(refreshToken) {
  return apiClient.post("/auth/logout", { refreshToken });
}

export function changeUserPassword(payload) {
  return apiClient.post("/auth/change-password", payload);
}
