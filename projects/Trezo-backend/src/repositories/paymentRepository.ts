import { pool } from "../config/database";

export type PaymentStatus = "pending" | "confirmed" | "failed";

export interface Payment {
  id: number;
  company_id: number;
  receiver_address: string;
  amount: string;
  asset_type: string;
  asset_id: number | null;
  description: string | null;
  transaction_hash: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentData {
  company_id: number;
  receiver_address: string;
  amount: string;
  asset_type: string;
  asset_id?: number | null;
  description?: string | null;
}

export class PaymentRepository {
  static async create(data: CreatePaymentData): Promise<Payment> {
    const result = await pool.query<Payment>(
      `INSERT INTO payments (company_id, receiver_address, amount, asset_type, asset_id, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.company_id, data.receiver_address, data.amount, data.asset_type, data.asset_id ?? null, data.description ?? null],
    );
    return result.rows[0];
  }

  static async updateStatus(id: number, status: PaymentStatus, txHash?: string): Promise<Payment | null> {
    const result = await pool.query<Payment>(
      `UPDATE payments SET status = $2, transaction_hash = COALESCE($3, transaction_hash), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, status, txHash ?? null],
    );
    return result.rows[0] ?? null;
  }

  static async findByCompanyId(companyId: number, limit = 20, offset = 0): Promise<Payment[]> {
    const result = await pool.query<Payment>(`SELECT * FROM payments WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [
      companyId,
      limit,
      offset,
    ]);
    return result.rows;
  }
}
