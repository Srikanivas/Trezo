import { NotificationRepository } from "../repositories/notificationRepository";
import { logger } from "../utils/logger";

export type NotificationType =
  | "INVOICE_RECEIVED"
  | "INVOICE_APPROVED"
  | "INVOICE_REJECTED"
  | "INVOICE_PAID"
  | "AUTOPAY_SUCCESS"
  | "AUTOPAY_FAILED"
  | "BUDGET_80_PERCENT";

export interface NotificationPayload {
  invoiceId?: number;
  txId?: string;
  reason?: string;
  budgetId?: number;
  currency?: string;
  period?: string;
  overage?: string;
  senderName?: string;
  receiverName?: string;
  amount?: string;
}

function buildNotification(type: NotificationType, payload: NotificationPayload): { title: string; body: string } {
  switch (type) {
    case "INVOICE_RECEIVED":
      return {
        title: "New Invoice Request",
        body: `You have received a new invoice request${payload.senderName ? ` from ${payload.senderName}` : ""}${payload.amount ? ` for ${payload.amount} ${payload.currency ?? "ALGO"}` : ""}.`,
      };
    case "INVOICE_APPROVED":
      return {
        title: "Invoice Approved",
        body: `Your invoice #${payload.invoiceId} has been approved${payload.receiverName ? ` by ${payload.receiverName}` : ""}.`,
      };
    case "INVOICE_REJECTED":
      return {
        title: "Invoice Rejected",
        body: `Your invoice #${payload.invoiceId} was rejected${payload.reason ? `: ${payload.reason}` : ""}.`,
      };
    case "INVOICE_PAID":
      return {
        title: "Invoice Paid",
        body: `Invoice #${payload.invoiceId} has been paid. Transaction: ${payload.txId ?? "N/A"}.`,
      };
    case "AUTOPAY_SUCCESS":
      return {
        title: "Autopay Successful",
        body: `Autopay executed for invoice #${payload.invoiceId}. Transaction: ${payload.txId ?? "N/A"}.`,
      };
    case "AUTOPAY_FAILED":
      return {
        title: "Autopay Failed",
        body: `Autopay failed for invoice #${payload.invoiceId}${payload.reason ? `: ${payload.reason}` : ""}. Please pay manually.`,
      };
    case "BUDGET_80_PERCENT":
      return {
        title: "Budget Alert",
        body: `You have used 80% of your ${payload.period ?? ""} ${payload.currency ?? ""} budget.`,
      };
    default:
      return { title: "Notification", body: "You have a new notification." };
  }
}

export class NotificationService {
  static async deliver(companyId: number, type: NotificationType, payload: NotificationPayload): Promise<void> {
    try {
      const { title, body } = buildNotification(type, payload);
      await NotificationRepository.create({
        company_id: companyId,
        type,
        title,
        body,
        invoice_id: payload.invoiceId ?? null,
      });
    } catch (err) {
      // Notifications are non-critical — log but don't throw
      logger.error(`Failed to deliver notification type=${type} to company=${companyId}:`, err);
    }
  }
}
