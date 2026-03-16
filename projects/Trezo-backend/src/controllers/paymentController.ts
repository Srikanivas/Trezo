import { Request, Response } from "express";
import { PaymentService } from "../services/paymentService";
import { logger } from "../utils/logger";

function getStatus(err: any): number {
  return err?.status ?? 500;
}

export class PaymentController {
  static async sendPayment(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const { receiver_address, amount, asset_type, asset_id, description } = req.body;
      const payment = await PaymentService.sendPayment({
        companyId,
        receiverAddress: receiver_address,
        amount: parseFloat(amount),
        assetType: asset_type || "ALGO",
        assetId: asset_id ? parseInt(asset_id) : null,
        description,
      });
      res.status(201).json({ success: true, data: payment });
    } catch (err) {
      logger.error("sendPayment error:", err);
      res.status(getStatus(err)).json({ success: false, error: (err as Error).message });
    }
  }

  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const payments = await PaymentService.getHistory(companyId, limit, offset);
      res.status(200).json({ success: true, data: payments });
    } catch (err) {
      logger.error("getHistory error:", err);
      res.status(500).json({ success: false, error: "Failed to fetch payment history" });
    }
  }
}
