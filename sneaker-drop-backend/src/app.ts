import "dotenv/config";
import express from "express";
import cors from "cors";
import dropRoutes from "./modules/drop/drop.routes";
import reservationRoutes from "./modules/reservation/reservation.routes";
import purchaseRoutes from "./modules/purchase/purchase.routes";
import userRoutes from "./modules/user/user.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: true, // Allow all origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/drops", dropRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/users", userRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
