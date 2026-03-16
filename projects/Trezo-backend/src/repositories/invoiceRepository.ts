import { pool } from "../config/database";

export type InvoiceStatus = "draft" | "pending_approval" | "approved" | "rejected" | "paid" | "cancelled";
export type VerificationStatus = "not_applicable" | "matched" | "mismatch" | "unverifiable" | "timeout" | "pending";

export interface Invoice {
  id: number;
  sender_company_id: number;
  receiver_company_id: number;
  amount: string;
  currency: string;
  asset_id: number | null;
  message: string;
  status: InvoiceStatus;
  autopay_enabled: boolean;
  autopay_failed: boolean;
  rejection_reason: string | null;
  transaction_id: string | null;
  receipt_image_id: number | null;
  bill_summary: any | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithParties extends Invoice {
  sender_company_name: string;
  receiver_company_name: string;
}

export interface CreateInvoiceData {
  sender_company_id: number;
  receiver_company_id: number;
  amount: string;
  currency: string;
  asset_id?: number | null;
  message: string;
  autopay_enabled?: boolean;
  receipt_image_id?: number | null;
}

export interface InvoiceInboxFilters {
  status?: InvoiceStatus;
  direction?: "sent" | "received";
  currency?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceSummary {
  total_payables: string;
  total_receivables: string;
  paid_this_month: string;
  pending_approval_count: number;
}

const WITH_PARTIES = `
  SELECT i.*,
    s.company_name AS sender_company_name,
    r.company_name AS receiver_company_name
  FROM invoices i
  JOIN companies s ON s.id = i.sender_company_id
  JOIN companies r ON r.id = i.receiver_company_id
`;

export class InvoiceRepository {
  static async create(data: CreateInvoiceData): Promise<InvoiceWithParties> {
    const result = await pool.query<Invoice>(
      `INSERT INTO invoices
         (sender_company_id, receiver_company_id, amount, currency, asset_id, message, autopay_enabled, receipt_image_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_approval')
       RETURNING *`,
      [
        data.sender_company_id,
        data.receiver_company_id,
        data.amount,
        data.currency,
        data.asset_id ?? null,
        data.message,
        data.autopay_enabled ?? false,
        data.receipt_image_id ?? null,
      ],
    );
    return this.findById(result.rows[0].id) as Promise<InvoiceWithParties>;
  }

  static async findById(id: number): Promise<InvoiceWithParties | null> {
    const result = await pool.query<InvoiceWithParties>(`${WITH_PARTIES} WHERE i.id = $1`, [id]);
    return result.rows[0] || null;
  }

  static async findInbox(companyId: number, filters: InvoiceInboxFilters = {}): Promise<InvoiceWithParties[]> {
    const conditions: string[] = ["(i.sender_company_id = $1 OR i.receiver_company_id = $1)"];
    const values: any[] = [companyId];
    let idx = 2;

    if (filters.direction === "sent") {
      conditions.push(`i.sender_company_id = $${idx++}`);
      values.push(companyId);
    } else if (filters.direction === "received") {
      conditions.push(`i.receiver_company_id = $${idx++}`);
      values.push(companyId);
    }

    if (filters.status) {
      conditions.push(`i.status = $${idx++}`);
      values.push(filters.status);
    }

    if (filters.currency) {
      conditions.push(`i.currency = $${idx++}`);
      values.push(filters.currency);
    }

    const limit = filters.limit ?? 20;
    const offset = ((filters.page ?? 1) - 1) * limit;

    const result = await pool.query<InvoiceWithParties>(
      `${WITH_PARTIES} WHERE ${conditions.join(" AND ")}
       ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset],
    );
    return result.rows;
  }

  static async updateStatus(
    id: number,
    status: InvoiceStatus,
    extra: { rejection_reason?: string; transaction_id?: string } = {},
  ): Promise<InvoiceWithParties | null> {
    const fields = ["status = $2", "updated_at = NOW()"];
    const values: any[] = [id, status];
    let idx = 3;

    if (extra.rejection_reason !== undefined) {
      fields.push(`rejection_reason = $${idx++}`);
      values.push(extra.rejection_reason);
    }
    if (extra.transaction_id !== undefined) {
      fields.push(`transaction_id = $${idx++}`);
      values.push(extra.transaction_id);
    }

    await pool.query(`UPDATE invoices SET ${fields.join(", ")} WHERE id = $1`, values);
    return this.findById(id);
  }

  static async updateBillSummary(id: number, billSummary: any, verificationStatus: VerificationStatus): Promise<void> {
    await pool.query("UPDATE invoices SET bill_summary = $1, verification_status = $2, updated_at = NOW() WHERE id = $3", [
      JSON.stringify(billSummary),
      verificationStatus,
      id,
    ]);
  }

  static async markPaid(id: number, txId: string): Promise<InvoiceWithParties | null> {
    return this.updateStatus(id, "paid", { transaction_id: txId });
  }

  static async setAutopayFailed(id: number, _reason: string): Promise<void> {
    await pool.query("UPDATE invoices SET autopay_failed = TRUE, updated_at = NOW() WHERE id = $1", [id]);
  }

  static async getSummary(companyId: number): Promise<InvoiceSummary> {
    const result = await pool.query<InvoiceSummary>(
      `SELECT
        COALESCE(SUM(CASE WHEN sender_company_id = $1 AND status IN ('pending_approval','approved') THEN amount ELSE 0 END), 0)::TEXT AS total_payables,
        COALESCE(SUM(CASE WHEN receiver_company_id = $1 AND status IN ('pending_approval','approved') THEN amount ELSE 0 END), 0)::TEXT AS total_receivables,
        COALESCE(SUM(CASE WHEN sender_company_id = $1 AND status = 'paid' AND DATE_TRUNC('month', updated_at) = DATE_TRUNC('month', NOW()) THEN amount ELSE 0 END), 0)::TEXT AS paid_this_month,
        COUNT(CASE WHEN receiver_company_id = $1 AND status = 'pending_approval' THEN 1 END)::INT AS pending_approval_count
       FROM invoices
       WHERE sender_company_id = $1 OR receiver_company_id = $1`,
      [companyId],
    );
    return result.rows[0];
  }
}
