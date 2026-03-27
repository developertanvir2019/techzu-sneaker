import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("❌ Error:", err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Prisma transaction conflict (concurrency)
  if (err.message.includes("deadlock") || err.message.includes("conflict")) {
    return res.status(409).json({
      success: false,
      error: "Too many requests - please try again",
    });
  }

  return res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};
