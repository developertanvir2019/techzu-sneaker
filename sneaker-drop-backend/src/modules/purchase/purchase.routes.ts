import { Router } from "express";
import { purchaseItem, listUserPurchases } from "./purchase.controller";

const router = Router();

router.post("/", purchaseItem);
router.get("/user/:userId", listUserPurchases);

export default router;
