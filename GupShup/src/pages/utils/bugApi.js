import { apiClient } from "../../lib/apiClient";

export function submitBugReport(payload) {
  return apiClient.post("/bug-reports", payload);
}

export function fetchBugReports() {
  return apiClient.get("/bug-reports");
}

export function resolveBugReportById(id) {
  return apiClient.patch(`/bug-reports/${id}/resolve`, {});
}

export function deleteBugReportById(id) {
  return apiClient.delete(`/bug-reports/${id}`);
}
