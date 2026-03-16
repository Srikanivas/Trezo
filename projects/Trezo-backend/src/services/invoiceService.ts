import {
  InvoiceRepository,
  InvoiceWithParties,
  CreateInvoiceData,
  InvoiceInboxFilters,
  InvoiceSummary,
} from "../repositories/invoiceRepository";
import { CompanyRepository } from "../repositories/companyRepository";
import { AuditLogRepository } from "../repositories/auditLogRepository";
import { TreasuryService } from "./treasuryService";
import { BudgetService } from "./budgetService";
import { AutopayEngine } from "./autopayEngine";
import { NotificationService } from "./notificationService";
import { ocrService, computeVerificationStatus } from "./ocrService";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

export interface CreateInvoiceRequest {
  senderCompanyId: number;
  receiverCompanyId: number;
  amount: string;
  currency: string;
  assetId?: number | null;
  message: string;
  autopayEnabled?: boolean;
  file?: Express.Multer.File;
}

export interface PayInvoiceResult {
  requiresConfirmation?: boolean;
  overage?: string;
  invoice?: InvoiceWithParties;
}

export class InvoiceService {
  static async createInvoice(req: CreateInvoiceRequest): Promise<InvoiceWithParties> {
    // Validate required fields
    if (!req.receiverCompanyId || !req.amount || !req.currency || !req.message) {
      throw Object.assign(new Error("recipient_company_id, amount, currency, and message are required"), { status: 400 });
    }
    if (parseFloat(req.amount) <= 0) {
      throw Object.assign(new Error("Amount must be greater than zero"), { status: 400 });
    }
    if (req.senderCompanyId === req.receiverCompanyId) {
      throw Object.assign(new Error("Cannot create invoice addressed to your own company"), { status: 400 });
    }

    const receiver = await CompanyRepository.findById(req.receiverCompanyId);
    if (!receiver) {
      throw Object.assign(new Error("Recipient company not found"), { status: 404 });
    }

    // Store receipt image if provided
    let receiptImageId: number | null = null;
    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      const imgResult = await pool.query(
        `INSERT INTO receipt_images (company_id, filename, mime_type, size_bytes, data)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [req.senderCompanyId, req.file.originalname, req.file.mimetype, req.file.size, base64],
      );
      receiptImageId = imgResult.rows[0].id;
    }

    const data: CreateInvoiceData = {
      sender_company_id: req.senderCompanyId,
      receiver_company_id: req.receiverCompanyId,
      amount: req.amount,
      currency: req.currency,
      asset_id: req.assetId ?? null,
      message: req.message,
      autopay_enabled: req.autopayEnabled ?? false,
      receipt_image_id: receiptImageId,
    };

    const invoice = await InvoiceRepository.create(data);

    // Run OCR asynchronously with 30s timeout
    if (req.file) {
      const file = req.file;
      const invoiceId = invoice.id;
      Promise.race([
        ocrService.extractBillData(file.buffer, file.mimetype, file.originalname),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("OCR_TIMEOUT")), 30000)),
      ])
        .then(async (summary) => {
          const vs = computeVerificationStatus(req.amount, summary.total);
          await InvoiceRepository.updateBillSummary(invoiceId, summary, vs);
        })
        .catch(async (err) => {
          const vs = err.message === "OCR_TIMEOUT" ? "timeout" : "unverifiable";
          await InvoiceRepository.updateBillSummary(invoiceId, null, vs as any);
        });
    }

    // Notify receiver
    const sender = await CompanyRepository.findById(req.senderCompanyId);
    await NotificationService.deliver(req.receiverCompanyId, "INVOICE_RECEIVED", {
      invoiceId: invoice.id,
      senderName: sender?.company_name,
      amount: req.amount,
      currency: req.currency,
    });

    return invoice;
  }

  static async getInbox(companyId: number, filters: InvoiceInboxFilters): Promise<InvoiceWithParties[]> {
    return InvoiceRepository.findInbox(companyId, filters);
  }

  static async getInvoice(id: number, companyId: number): Promise<InvoiceWithParties> {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (invoice.sender_company_id !== companyId && invoice.receiver_company_id !== companyId) {
      throw Object.assign(new Error("Access denied"), { status: 403 });
    }
    return invoice;
  }

  static async approveInvoice(id: number, companyId: number): Promise<InvoiceWithParties> {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (invoice.receiver_company_id !== companyId) {
      throw Object.assign(new Error("Only the recipient can approve or reject an invoice"), { status: 403 });
    }
    if (invoice.status !== "pending_approval") {
      throw Object.assign(new Error("Invoice is not in pending_approval status"), { status: 400 });
    }

    const updated = await InvoiceRepository.updateStatus(id, "approved");

    await NotificationService.deliver(invoice.sender_company_id, "INVOICE_APPROVED", {
      invoiceId: id,
      receiverName: updated?.receiver_company_name,
    });

    // Trigger autopay synchronously
    await AutopayEngine.onInvoiceApproved(id);

    return (await InvoiceRepository.findById(id))!;
  }

  static async rejectInvoice(id: number, companyId: number, reason: string): Promise<InvoiceWithParties> {
    if (!reason || reason.trim().length < 10) {
      throw Object.assign(new Error("Rejection reason must be at least 10 characters"), { status: 400 });
    }
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (invoice.receiver_company_id !== companyId) {
      throw Object.assign(new Error("Only the recipient can approve or reject an invoice"), { status: 403 });
    }
    if (invoice.status !== "pending_approval") {
      throw Object.assign(new Error("Invoice is not in pending_approval status"), { status: 400 });
    }

    const updated = await InvoiceRepository.updateStatus(id, "rejected", { rejection_reason: reason.trim() });

    await NotificationService.deliver(invoice.sender_company_id, "INVOICE_REJECTED", {
      invoiceId: id,
      reason: reason.trim(),
    });

    return updated!;
  }

  static async cancelInvoice(id: number, companyId: number): Promise<InvoiceWithParties> {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (invoice.sender_company_id !== companyId) {
      throw Object.assign(new Error("Only the sender can cancel an invoice"), { status: 403 });
    }
    if (invoice.status !== "pending_approval") {
      throw Object.assign(new Error("Only pending_approval invoices can be cancelled"), { status: 400 });
    }
    return (await InvoiceRepository.updateStatus(id, "cancelled"))!;
  }

  static async payInvoice(id: number, companyId: number, confirmed = false): Promise<PayInvoiceResult> {
    const invoice = await InvoiceRepository.findById(id);
    if (!invoice) throw Object.assign(new Error("Invoice not found"), { status: 404 });
    if (invoice.sender_company_id !== companyId) {
      throw Object.assign(new Error("Only the sender can pay an invoice"), { status: 403 });
    }
    if (invoice.status !== "approved") {
      throw Object.assign(new Error("Invoice must be in approved status to pay"), { status: 400 });
    }

    // Budget check
    const budgetCheck = await BudgetService.checkBudget(companyId, invoice.amount, invoice.currency, invoice.asset_id);
    if (budgetCheck.exceeded && !confirmed) {
      return { requiresConfirmation: true, overage: budgetCheck.overage };
    }

    const receiverCompany = await CompanyRepository.findById(invoice.receiver_company_id);
    if (!receiverCompany) throw Object.assign(new Error("Receiver company not found"), { status: 404 });

    const senderCompany = await CompanyRepository.findById(companyId);

    const txId = await TreasuryService.sendTransaction({
      companyId,
      receiverAddress: receiverCompany.wallet_address,
      amount: parseFloat(invoice.amount),
      assetId: invoice.asset_id ?? undefined,
      note: `TREZO_INVOICE_${id}`,
    });

    const updated = await InvoiceRepository.markPaid(id, txId);

    await AuditLogRepository.create({
      company_id: companyId,
      operation_type: "INVOICE_PAID",
      wallet_address: senderCompany?.wallet_address ?? "",
      transaction_id: txId,
      amount: Math.round(parseFloat(invoice.amount) * 1_000_000),
      details: { invoice_id: id, timestamp: new Date().toISOString() },
    });

    await BudgetService.recordPayment(companyId, invoice.amount, invoice.currency, invoice.asset_id);

    await NotificationService.deliver(companyId, "INVOICE_PAID", { invoiceId: id, txId });
    await NotificationService.deliver(invoice.receiver_company_id, "INVOICE_PAID", { invoiceId: id, txId });

    logger.info(`Invoice ${id} paid by company ${companyId}, txId=${txId}`);
    return { invoice: updated! };
  }

  static async getSummary(companyId: number): Promise<InvoiceSummary> {
    return InvoiceRepository.getSummary(companyId);
  }

  static async getReceipt(id: number, companyId: number): Promise<{ data: string; mimeType: string; filename: string }> {
    const invoice = await this.getInvoice(id, companyId);
    if (!invoice.receipt_image_id) {
      throw Object.assign(new Error("No receipt attached to this invoice"), { status: 404 });
    }
    const result = await pool.query("SELECT data, mime_type, filename FROM receipt_images WHERE id = $1", [invoice.receipt_image_id]);
    if (!result.rows[0]) throw Object.assign(new Error("Receipt not found"), { status: 404 });
    return { data: result.rows[0].data, mimeType: result.rows[0].mime_type, filename: result.rows[0].filename };
  }
}
