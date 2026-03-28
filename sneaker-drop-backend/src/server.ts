import "dotenv/config";
import "./config/processHandlers"; // Must be second — registers handlers before redis loads
import http from "http";


import app from "./app";
import { initSocket } from "./socket";
import { createReservationWorker } from "./workers/reservationWorker";
import { startExpiryPoller } from "./config/expiryPoller";
import { prisma } from "./config/prisma";

const PORT = parseInt(process.env.PORT || "3001", 10);

async function bootstrap() {
  // 1. Create HTTP server from Express app
  const httpServer = http.createServer(app);

  // 2. Initialize Socket.io on the same HTTP server
  initSocket(httpServer);

  // 3. Start BullMQ worker for reservation expiry
  const worker = createReservationWorker();

  // 4. Start DB-level fallback poller (handles missed BullMQ jobs)
  const pollerTimer = startExpiryPoller();
  console.log("⏱️  Expiry poller started (10s sweep)");

  // 5. Verify DB connection
  await prisma.$connect();
  console.log("✅ Database connected");

  // 6. Start listening
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
    console.log(`⚙️  BullMQ worker started`);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    clearInterval(pollerTimer);
    await worker.close();
    await prisma.$disconnect();
    httpServer.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
