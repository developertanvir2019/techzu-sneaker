import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/errorHandler";
import { emitStockUpdate, emitPurchaseConfirmed } from "../../socket";

export const completePurchase = async (userId: string, dropId: string) => {
  const { purchase, updatedDrop, username } = await prisma.$transaction(
    async (tx) => {
      // 1. Verify user has an ACTIVE reservation
      const reservation = await tx.reservation.findFirst({
        where: { userId, dropId, status: "ACTIVE" },
        include: { user: true },
      });

      if (!reservation) {
        throw new AppError(
          "No active reservation found. Reserve the item first or your reservation may have expired.",
          409
        );
      }

      // 2. Mark reservation as COMPLETED
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "COMPLETED" },
      });

      // 3. Create purchase record (stock already decremented during reservation)
      const purchase = await tx.purchase.create({
        data: { userId, dropId },
        include: { user: true, drop: true },
      });

      // 4. Fetch latest drop for emit
      const updatedDrop = await tx.drop.findUniqueOrThrow({
        where: { id: dropId },
      });

      return {
        purchase,
        updatedDrop,
        username: reservation.user.username,
      };
    },
    { isolationLevel: "Serializable" }
  );

  // Emit updates
  emitStockUpdate(updatedDrop);
  emitPurchaseConfirmed({
    dropId,
    userId,
    username,
    availableStock: updatedDrop.availableStock,
  });

  return purchase;
};

export const getUserPurchases = async (userId: string) => {
  return prisma.purchase.findMany({
    where: { userId },
    include: { drop: true },
    orderBy: { createdAt: "desc" },
  });
};
