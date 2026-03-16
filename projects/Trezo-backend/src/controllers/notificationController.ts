import { Request, Response } from "express";
import { NotificationRepository } from "../repositories/notificationRepository";
import { logger } from "../utils/logger";

export class NotificationController {
  static async listNotifications(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const notifications = await NotificationRepository.findByCompany(companyId, 50);
      res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      logger.error("listNotifications error:", err);
      res.status(500).json({ success: false, error: "Failed to fetch notifications" });
    }
  }

  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const count = await NotificationRepository.countUnread(companyId);
      res.status(200).json({ success: true, data: { count } });
    } catch (err) {
      logger.error("getUnreadCount error:", err);
      res.status(500).json({ success: false, error: "Failed to get unread count" });
    }
  }

  static async markRead(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      await NotificationRepository.markRead(id, companyId);
      res.status(200).json({ success: true });
    } catch (err) {
      logger.error("markRead error:", err);
      res.status(500).json({ success: false, error: "Failed to mark notification as read" });
    }
  }

  static async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      await NotificationRepository.markAllRead(companyId);
      res.status(200).json({ success: true });
    } catch (err) {
      logger.error("markAllRead error:", err);
      res.status(500).json({ success: false, error: "Failed to mark all notifications as read" });
    }
  }
}
