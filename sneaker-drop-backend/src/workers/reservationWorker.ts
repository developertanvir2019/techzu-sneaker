import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { prisma } from "../config/prisma";
import {
  emitStockUpdate,
  emitReservationExpired,
} from "../socket";

interface ExpireJobData {
  reservationId: string;
}

export const createReservationWorker = () => {
  const worker = new Worker<ExpireJobData>(
    "reservation-expiry",
    async (job: Job<ExpireJobData>) => {
      const { reservationId } = job.data;
      console.log(`⏱️  Processing expiry for reservation: ${reservationId}`);

      // Use a transaction to atomically:
      // 1. Check if still ACTIVE
      // 2. Mark as EXPIRED
      // 3. Restore stock
      const result = await prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({
          where: { id: reservationId },
          include: { drop: true, user: true },
        });

        if (!reservation) {
          console.log(`Reservation ${reservationId} not found - skipping`);
          return null;
        }

        if (reservation.status !== "ACTIVE") {
          console.log(
            `Reservation ${reservationId} is ${reservation.status} - skipping`
          );
          return null;
        }

        // Mark as expired
        await tx.reservation.update({
          where: { id: reservationId },
          data: { status: "EXPIRED" },
        });

        // Restore stock
        const updatedDrop = await tx.drop.update({
          where: { id: reservation.dropId },
          data: { availableStock: { increment: 1 } },
        });

        return {
          reservation,
          updatedDrop,
          userId: reservation.userId,
          username: reservation.user.username,
        };
      });

      if (result) {
        // Emit WebSocket events
        emitStockUpdate(result.updatedDrop);
        emitReservationExpired({
          reservationId,
          dropId: result.reservation.dropId,
          userId: result.userId,
          availableStock: result.updatedDrop.availableStock,
        });

        console.log(
          `✅ Reservation ${reservationId} expired. Stock restored for drop ${result.reservation.dropId}. New stock: ${result.updatedDrop.availableStock}`
        );
      }
    },
    {
      connection: redisConnection,
      concurrency: 10, // Process up to 10 expiry jobs simultaneously
      limiter: {
        max: 100,
        duration: 1000, // Max 100 jobs/second to protect DB
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ Expiry job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Expiry job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err: NodeJS.ErrnoException) => {
    // ECONNRESET = Upstash dropped idle connection, BullMQ auto-reconnects — safe to ignore
    if (err.code !== "ECONNRESET" && err.code !== "EPIPE") {
      console.error("❌ Worker error:", err);
    }
  });

  return worker;
};
