import http from "http";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { bootstrapAdmin } from "./utils/bootstrapAdmin.js";
import { setupSocket } from "./utils/socket.js";

async function startServer() {
  await connectDatabase();
  await bootstrapAdmin();
  const server = http.createServer(app);
  setupSocket(server, env.clientUrl);
  server.listen(env.port, () => {
    console.log(`GupShup backend running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
