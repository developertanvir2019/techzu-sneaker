import { prisma } from "../../config/prisma";

export const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: { username: "asc" },
    select: { id: true, username: true, createdAt: true },
  });
};

export const createUser = async (username: string) => {
  if (!username || username.trim().length < 2) {
    throw new Error("Username must be at least 2 characters");
  }

  return prisma.user.create({
    data: { username: username.trim() },
    select: { id: true, username: true, createdAt: true },
  });
};

export const getUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, createdAt: true },
  });
};
