import { Router } from "express";
import {
  reserveItem,
  checkReservation,
  listUserReservations,
} from "./reservation.controller";

const router = Router();

router.post("/", reserveItem);
router.get("/check", checkReservation);
router.get("/user/:userId", listUserReservations);

export default router;
