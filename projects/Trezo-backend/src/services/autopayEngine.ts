import { InvoiceRepository } from "../repositories/invoiceRepository";
import { CompanyRepository } from "../repositories/companyRepository";
import { TreasuryService } from "./treasuryService";
import { BudgetService } from "./budgetService";
import { NotificationService } from "./notificationService";
import { AuditLogRepository } from "../repositories/auditLogRepository";
import { logger } from "../utils/logger";

export class AutopayEngine {
  static async onInvoiceApproved(invoiceId: number): Promise<void> {
    const invoice = await InvoiceRepository.findById(invoiceId);
    if (!invoice?.autopay_enabled) return;

    try {
      const receiverCompany = await CompanyRepository.findById(invoice.receiver_company_id);
      if (!receiverCompany) throw new Error("Receiver company not found");

      const txId = await TreasuryService.sendTransaction({
        companyId: invoice.sender_company_id,
        receiverAddress: receiverCompany.wallet_address,
        amount: parseFloat(invoice.amount),
        assetId: invoice.asset_id ?? undefined,
        note: `TREZO_INVOICE_${invoiceId}`,
      });

      await InvoiceRepository.markPaid(invoiceId, txId);

      await AuditLogRepository.create({
        company_id: invoice.sender_company_id,
        operation_type: "INVOICE_PAID",
        wallet_address: receiverCompany.wallet_address,
        transaction_id: txId,
        amount: Math.round(parseFloat(invoice.amount) * 1_000_000),
        details: { invoice_id: invoiceId, autopay: true, timestamp: new Date().toISOString() },
      });

      await BudgetService.recordPayment(invoice.sender_company_id, invoice.amount, invoice.currency, invoice.asset_id);

      await NotificationService.deliver(invoice.sender_company_id, "AUTOPAY_SUCCESS", {
        invoiceId,
        txId,
      });
      await NotificationService.deliver(invoice.receiver_company_id, "INVOICE_PAID", {
        invoiceId,
        txId,
      });

      logger.info(`Autopay succeeded for invoice ${invoiceId}, txId=${txId}`);
    } catch (err) {
      const reason = (err as Error).message;
      logger.error(`Autopay failed for invoice ${invoiceId}: ${reason}`);

      await InvoiceRepository.setAutopayFailed(invoiceId, reason);
      await NotificationService.deliver(invoice.sender_company_id, "AUTOPAY_FAILED", {
        invoiceId,
        reason,
      });
      // Do NOT rethrow — approval must still succeed
    }
  }
}
