import { Server } from "socket.io";

let io;

export function setupSocket(httpServer, clientUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [clientUrl, "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("chat:join", (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on("chat:leave", (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // ── WebRTC Signaling ──────────────────────────────────────────────────────
    // Each payload must include { targetUserId, ... }

    socket.on("call:offer", ({ targetUserId, offer, callType, callerName }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit("call:incoming", {
          fromUserId: userId,
          callerName: callerName || "Someone",
          callType: callType || "audio",
          offer,
        });
      }
    });

    socket.on("call:answer", ({ targetUserId, answer }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit("call:answered", { answer });
      }
    });

    socket.on("call:ice-candidate", ({ targetUserId, candidate }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit("call:ice-candidate", { candidate });
      }
    });

    socket.on("call:end", ({ targetUserId }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit("call:ended");
      }
    });

    socket.on("call:reject", ({ targetUserId }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit("call:rejected");
      }
    });
    // ─────────────────────────────────────────────────────────────────────────
  });

  return io;
}

export function getSocketServer() {
  return io;
}
