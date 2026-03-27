import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/errorHandler";

export interface CreateDropInput {
  name: string;
  price: number;
  totalStock: number;
  startTime: string;
  imageUrl?: string;
  description?: string;
  brand?: string;
  colorway?: string;
}

export const getDropsWithActivity = async () => {
  const drops = await prisma.drop.findMany({
    orderBy: { startTime: "asc" },
    include: {
      purchases: {
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, username: true } },
        },
      },
    },
  });

  return drops.map((drop) => ({
    ...drop,
    recentPurchasers: drop.purchases.map((p) => ({
      purchaseId: p.id,
      userId: p.userId,
      username: p.user.username,
      purchasedAt: p.createdAt,
    })),
    purchases: undefined, // strip raw purchases from response
  }));
};

export const getDropById = async (id: string) => {
  const drop = await prisma.drop.findUnique({
    where: { id },
    include: {
      purchases: {
        take: 3,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, username: true } },
        },
      },
    },
  });

  if (!drop) throw new AppError("Drop not found", 404);
  return drop;
};

export const createDrop = async (data: CreateDropInput) => {
  const { name, price, totalStock, startTime, imageUrl, description, brand, colorway } = data;

  if (!name || !price || !totalStock || !startTime) {
    throw new AppError("name, price, totalStock, and startTime are required");
  }

  if (totalStock < 1) throw new AppError("totalStock must be at least 1");
  if (price < 0) throw new AppError("price cannot be negative");

  const drop = await prisma.drop.create({
    data: {
      name,
      price,
      totalStock,
      availableStock: totalStock, // Initialize available = total
      startTime: new Date(startTime),
      imageUrl,
      description,
      brand,
      colorway,
    },
  });

  return drop;
};
