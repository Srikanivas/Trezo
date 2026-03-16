import { pool } from "../config/database";

export interface Notification {
  id: number;
  company_id: number;
  type: string;
  title: string;
  body: string;
  invoice_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationData {
  company_id: number;
  type: string;
  title: string;
  body: string;
  invoice_id?: number | null;
}

export class NotificationRepository {
  static async create(data: CreateNotificationData): Promise<Notification> {
    const result = await pool.query<Notification>(
      `INSERT INTO notifications (company_id, type, title, body, invoice_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.company_id, data.type, data.title, data.body, data.invoice_id ?? null],
    );
    return result.rows[0];
  }

  static async findByCompany(companyId: number, limit = 50): Promise<Notification[]> {
    const result = await pool.query<Notification>("SELECT * FROM notifications WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2", [
      companyId,
      limit,
    ]);
    return result.rows;
  }

  static async markRead(id: number, companyId: number): Promise<boolean> {
    const result = await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1 AND company_id = $2", [id, companyId]);
    return (result.rowCount ?? 0) > 0;
  }

  static async markAllRead(companyId: number): Promise<void> {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE company_id = $1 AND is_read = FALSE", [companyId]);
  }

  static async countUnread(companyId: number): Promise<number> {
    const result = await pool.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM notifications WHERE company_id = $1 AND is_read = FALSE",
      [companyId],
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  }
}
