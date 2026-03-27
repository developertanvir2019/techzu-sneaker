import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/errorHandler";
import { scheduleReservationExpiry } from "../../queue/reservationQueue";
import { emitStockUpdate } from "../../socket";

const RESERVATION_TTL_MS = 60 * 1000; // 60 seconds

export const createReservation = async (userId: string, dropId: string) => {
  // Check if user already has an ACTIVE reservation for this drop
  const existingReservation = await prisma.reservation.findFirst({
    where: { userId, dropId, status: "ACTIVE" },
  });

  if (existingReservation) {
    throw new AppError("You already have an active reservation for this item");
  }

  // CRITICAL: Atomic transaction to prevent race conditions / overselling
  // Single transaction ensures: check stock → decrement → create reservation
  // at no point can two concurrent requests both see availableStock > 0 and both succeed
  const { reservation, updatedDrop } = await prisma.$transaction(
    async (tx) => {
      // 1. Lock & read the drop row (Postgres serializable isolation)
      const drop = await tx.drop.findUnique({
        where: { id: dropId },
      });

      if (!drop) throw new AppError("Drop not found", 404);
      if (drop.availableStock <= 0) {
        throw new AppError("Sorry, this item is out of stock!", 409);
      }

      // 2. Atomically decrement stock
      const updatedDrop = await tx.drop.update({
        where: {
          id: dropId,
          availableStock: { gt: 0 }, // Extra guard: double-check in WHERE clause
        },
        data: { availableStock: { decrement: 1 } },
      });

      if (!updatedDrop) {
        throw new AppError("Item sold out just now - please try again", 409);
      }

      // 3. Create reservation record
      const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
      const reservation = await tx.reservation.create({
        data: { userId, dropId, expiresAt },
        include: { user: true, drop: true },
      });

      return { reservation, updatedDrop };
    },
    {
      // Use serializable isolation for maximum concurrency safety
      isolationLevel: "Serializable",
    }
  );

  // Schedule BullMQ delayed expiry job (outside transaction - idempotent)
  await scheduleReservationExpiry(reservation.id, RESERVATION_TTL_MS);

  // Broadcast live stock update to all connected clients
  emitStockUpdate(updatedDrop);

  return reservation;
};

export const getActiveReservation = async (userId: string, dropId: string) => {
  return prisma.reservation.findFirst({
    where: { userId, dropId, status: "ACTIVE" },
  });
};

export const getUserReservations = async (userId: string) => {
  return prisma.reservation.findMany({
    where: { userId, status: "ACTIVE" },
    include: { drop: true },
  });
};
