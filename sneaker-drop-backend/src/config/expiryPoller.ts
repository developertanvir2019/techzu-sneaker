import { prisma } from "./prisma";
import { emitReservationExpired, emitStockUpdate } from "../socket";

const POLL_INTERVAL_MS = 10_000; // run every 10 seconds

/**
 * Fallback sweeper for expired reservations.
 *
 * BullMQ delayed jobs handle this in the happy path, but Upstash serverless
 * Redis drops idle connections that BullMQ needs for SUBSCRIBE/BLPOP, causing
 * delayed jobs to be missed.  This cron runs entirely against PostgreSQL and
 * serves as a guaranteed recovery mechanism independent of Redis.
 */
export const startExpiryPoller = (): NodeJS.Timeout => {
  const sweep = async () => {
    try {
      // Find all ACTIVE reservations whose 60-second window has passed
      const expired = await prisma.reservation.findMany({
        where: {
          status: "ACTIVE",
          expiresAt: { lte: new Date() },
        },
        include: { drop: true, user: true },
        take: 50, // safety cap per sweep
      });

      if (expired.length === 0) return;

      for (const reservation of expired) {
        const result = await prisma.$transaction(async (tx) => {
          // Re-check inside transaction — race-safe
          const r = await tx.reservation.findUnique({
            where: { id: reservation.id },
          });
          if (!r || r.status !== "ACTIVE") return null;

          // Mark expired
          await tx.reservation.update({
            where: { id: reservation.id },
            data: { status: "EXPIRED" },
          });

          // Restore stock
          const updatedDrop = await tx.drop.update({
            where: { id: reservation.dropId },
            data: { availableStock: { increment: 1 } },
          });

          return { updatedDrop };
        });

        if (result) {
          console.log(
            `🔄 [Poller] Expired reservation ${reservation.id} — stock restored for drop ${reservation.dropId} → ${result.updatedDrop.availableStock}`
          );
          emitStockUpdate(result.updatedDrop);
          emitReservationExpired({
            reservationId: reservation.id,
            dropId: reservation.dropId,
            userId: reservation.userId,
            availableStock: result.updatedDrop.availableStock,
          });
        }
      }
    } catch (err) {
      console.error("❌ [Poller] Error sweeping expired reservations:", err);
    }
  };

  return setInterval(() => void sweep(), POLL_INTERVAL_MS);
};
