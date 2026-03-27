import { Request, Response, NextFunction } from "express";
import {
  getDropsWithActivity,
  getDropById,
  createDrop,
  CreateDropInput,
} from "./drop.service";

export const listDrops = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const drops = await getDropsWithActivity();
    res.json({ success: true, data: drops });
  } catch (err) {
    next(err);
  }
};

export const getDrop = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const drop = await getDropById(req.params.id);
    res.json({ success: true, data: drop });
  } catch (err) {
    next(err);
  }
};

export const createDropHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const drop = await createDrop(req.body as CreateDropInput);
    res.status(201).json({ success: true, data: drop });
  } catch (err) {
    next(err);
  }
};
