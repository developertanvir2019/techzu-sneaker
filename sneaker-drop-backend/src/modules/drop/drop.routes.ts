import { Router } from "express";
import {
  listDrops,
  getDrop,
  createDropHandler,
} from "./drop.controller";

const router = Router();

router.get("/", listDrops);
router.get("/:id", getDrop);
router.post("/", createDropHandler);

export default router;
