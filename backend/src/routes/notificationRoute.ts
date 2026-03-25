import express from "express";
import {
  getNotifications,
  markNotificationRead
} from "../controllers/notificationController";
import { authenticate } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authenticate, getNotifications);
router.patch("/:id", authenticate, markNotificationRead);

export default router;