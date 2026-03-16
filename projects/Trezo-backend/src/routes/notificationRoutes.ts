import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/", authenticateToken, NotificationController.listNotifications);
router.get("/unread-count", authenticateToken, NotificationController.getUnreadCount);
router.post("/:id/read", authenticateToken, NotificationController.markRead);
router.post("/read-all", authenticateToken, NotificationController.markAllRead);

export default router;
