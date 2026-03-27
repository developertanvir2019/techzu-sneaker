import { Router } from "express";
import { listUsers, createUserHandler, getUser } from "./user.controller";

const router = Router();

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUserHandler);

export default router;
