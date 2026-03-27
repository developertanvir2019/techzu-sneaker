import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
    // Performance tuning for high traffic
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
    allowUpgrades: true,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} - ${reason}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

// ─── Typed Event Emitters ─────────────────────────────────────────────────────

export const emitStockUpdate = (drop: {
  id: string;
  availableStock: number;
  [key: string]: unknown;
}) => {
  getIO().emit("stock:update", drop);
};

export const emitReservationExpired = (data: {
  reservationId: string;
  dropId: string;
  userId: string;
  availableStock: number;
}) => {
  getIO().emit("reservation:expired", data);
};

export const emitPurchaseConfirmed = (data: {
  dropId: string;
  userId: string;
  username: string;
  availableStock: number;
}) => {
  getIO().emit("purchase:confirmed", data);
};
