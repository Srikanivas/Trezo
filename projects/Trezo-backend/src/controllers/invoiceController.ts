import { Request, Response } from "express";
import { InvoiceService } from "../services/invoiceService";
import { InvoiceInboxFilters, InvoiceStatus } from "../repositories/invoiceRepository";
import { logger } from "../utils/logger";

function getStatus(err: any): number {
  return err?.status ?? 500;
}

export class InvoiceController {
  static async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const { receiver_company_id, amount, currency, asset_id, message, autopay_enabled } = req.body;
      const invoice = await InvoiceService.createInvoice({
        senderCompanyId: companyId,
        receiverCompanyId: parseInt(receiver_company_id),
        amount: String(amount),
        currency,
        assetId: asset_id ? parseInt(asset_id) : null,
        message,
        autopayEnabled: autopay_enabled === "true" || autopay_enabled === true,
        file: req.file,
      });
      res.status(201).json({ success: true, data: invoice });
    } catch (err) {
      logger.error("createInvoice error:", err);
      res.status(getStatus(err)).json({ success: false, error: (err as Error).message });
    }
  }

  static async getInbox(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const filters: InvoiceInboxFilters = {
        status: req.query.status as InvoiceStatus | undefined,
        direction: req.query.direction as "sent" | "received" | undefined,
        currency: req.query.currency as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };
      const invoices = await InvoiceService.getInbox(companyId, filters);
      res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      logger.error("getInbox error:", err);
      res.status(500).json({ success: false, error: "Failed to fetch inbox" });
    }
  }

  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const summary = await InvoiceService.getSummary(companyId);
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      logger.error("getSummary error:", err);
      res.status(500).json({ success: false, error: "Failed to fetch summary" });
    }
  }

  static async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const invoice = await InvoiceService.getInvoice(id, companyId);
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      logger.error("getInvoice error:", err);
      res.status(getStatus(err)).json({ success: false, error: (err as Error).message });
    }
  }

  static async getReceipt(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const { data, mimeType, filename } = await InvoiceService.getReceipt(id, companyId);
      const buffer = Buffer.from(data, "base64");
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.send(buffer);
    } catch (err) {
      logger.error("getReceipt error:", err);
      res.status(getStatus(err)).json({ success: false, error: (err as Error).message });
    }
  }

  static async approveInvoice(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const invoice = await InvoiceService.approveInvoice(id, companyId);
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      logger.error("approveInvoice error:", err);
      res.status(getStatus(err)).json({ success: false, error: (err as Error).message });
    }
  }

  static async rejectInvoice(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const invoice = await InvoiceService.rejectInvoice(id, companyId, reason);
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      logger.error("rejectInvoice error:", err);
      res.status(getStatus(err)).json({ success: false, error: (err as Error).message });
    }
  }

  static async cancelInvoice(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const invoice = await InvoiceService.cancelInvoice(id, companyId);
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      logger.error("cancelInvoice error:", err);
      res.status(getStatus(err)).json({ success: false, error: (err as Error).message });
    }
  }

  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const summary = await InvoiceService.getSummary(companyId);
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      logger.error("getStats error:", err);
      res.status(500).json({ success: false, error: "Failed to fetch invoice stats" });
    }
  }

  static async payInvoice(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const { confirmed } = req.body;
      const result = await InvoiceService.payInvoice(id, companyId, confirmed === true);
      if (result.requiresConfirmation) {
        res.status(200).json({ success: true, requiresConfirmation: true, overage: result.overage });
        return;
      }
      res.status(200).json({ success: true, data: result.invoice });
    } catch (err) {
      logger.error("payInvoice error:", err);
      res.status(getStatus(err)).json({ success: false, error: (err as Error).message });
    }
  }
}
