// This file has NO imports intentionally.
// In CommonJS (how ts-node runs), require() executes module bodies immediately.
// A file with no further requires registers process handlers BEFORE any other
// module (like redis.ts) loads — solving the "handler registered too late" problem.

process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  // ECONNRESET / EPIPE = Upstash serverless drops idle connections.
  // BullMQ's internally duplicated IORedis instances have no error listeners,
  // so these surface here. They are harmless — IORedis/BullMQ auto-reconnect.
  if (err.code === "ECONNRESET" || err.code === "EPIPE") return;
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});
