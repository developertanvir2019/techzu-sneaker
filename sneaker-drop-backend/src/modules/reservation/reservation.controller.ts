import { Request, Response, NextFunction } from "express";
import {
  createReservation,
  getActiveReservation,
  getUserReservations,
} from "./reservation.service";

export const reserveItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, dropId } = req.body;
    if (!userId || !dropId) {
      return res
        .status(400)
        .json({ success: false, error: "userId and dropId are required" });
    }
    const reservation = await createReservation(userId, dropId);
    res.status(201).json({ success: true, data: reservation });
  } catch (err) {
    next(err);
  }
};

export const checkReservation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, dropId } = req.query as {
      userId: string;
      dropId: string;
    };
    const reservation = await getActiveReservation(userId, dropId);
    res.json({ success: true, data: reservation });
  } catch (err) {
    next(err);
  }
};

export const listUserReservations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reservations = await getUserReservations(req.params.userId);
    res.json({ success: true, data: reservations });
  } catch (err) {
    next(err);
  }
};
