import { io } from "socket.io-client";

const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || `http://${hostname}:5000/api`).replace(/\/api$/, "");

let socket;

export function getSocketClient() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
