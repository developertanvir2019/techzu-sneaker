import { Request, Response, NextFunction } from "express";
import { completePurchase, getUserPurchases } from "./purchase.service";

export const purchaseItem = async (
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
    const purchase = await completePurchase(userId, dropId);
    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
};

export const listUserPurchases = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const purchases = await getUserPurchases(req.params.userId);
    res.json({ success: true, data: purchases });
  } catch (err) {
    next(err);
  }
};
