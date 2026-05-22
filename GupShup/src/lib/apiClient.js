const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${hostname}:5000/api`;

function getAccessToken() {
  return localStorage.getItem("token") || "";
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const body = options.body;

  if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: body && headers.get("Content-Type") === "application/json" ? JSON.stringify(body) : body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const apiClient = {
  request,
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};
