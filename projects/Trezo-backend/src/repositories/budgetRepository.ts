import { pool } from "../config/database";

export interface Budget {
  id: number;
  company_id: number;
  name: string;
  currency: string;
  asset_id: number | null;
  limit_amount: string;
  period: "monthly" | "quarterly";
  consumed_amount: string;
  period_start: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetData {
  company_id: number;
  name: string;
  currency: string;
  asset_id?: number | null;
  limit_amount: string;
  period: "monthly" | "quarterly";
  period_start: string;
}

export interface BudgetCheckResult {
  budgetId: number | null;
  exceeded: boolean;
  currentConsumed: string;
  limit: string;
  overage: string;
}

export class BudgetRepository {
  static async create(data: CreateBudgetData): Promise<Budget> {
    const result = await pool.query<Budget>(
      `INSERT INTO budgets (company_id, name, currency, asset_id, limit_amount, period, period_start)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.company_id, data.name, data.currency, data.asset_id ?? null, data.limit_amount, data.period, data.period_start],
    );
    return result.rows[0];
  }

  static async findByCompany(companyId: number): Promise<Budget[]> {
    const result = await pool.query<Budget>("SELECT * FROM budgets WHERE company_id = $1 ORDER BY created_at DESC", [companyId]);
    return result.rows;
  }

  static async findById(id: number, companyId: number): Promise<Budget | null> {
    const result = await pool.query<Budget>("SELECT * FROM budgets WHERE id = $1 AND company_id = $2", [id, companyId]);
    return result.rows[0] || null;
  }

  static async update(id: number, companyId: number, data: Partial<CreateBudgetData>): Promise<Budget | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.currency !== undefined) {
      fields.push(`currency = $${idx++}`);
      values.push(data.currency);
    }
    if (data.asset_id !== undefined) {
      fields.push(`asset_id = $${idx++}`);
      values.push(data.asset_id);
    }
    if (data.limit_amount !== undefined) {
      fields.push(`limit_amount = $${idx++}`);
      values.push(data.limit_amount);
    }
    if (data.period !== undefined) {
      fields.push(`period = $${idx++}`);
      values.push(data.period);
    }

    if (fields.length === 0) return this.findById(id, companyId);

    fields.push(`updated_at = NOW()`);
    values.push(id, companyId);

    const result = await pool.query<Budget>(
      `UPDATE budgets SET ${fields.join(", ")} WHERE id = $${idx++} AND company_id = $${idx++} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  }

  static async delete(id: number, companyId: number): Promise<boolean> {
    const result = await pool.query("DELETE FROM budgets WHERE id = $1 AND company_id = $2", [id, companyId]);
    return (result.rowCount ?? 0) > 0;
  }

  static async findActiveForCurrency(companyId: number, currency: string, assetId?: number | null): Promise<Budget | null> {
    const result = await pool.query<Budget>(
      `SELECT * FROM budgets
       WHERE company_id = $1 AND currency = $2 AND is_active = TRUE
         AND (asset_id = $3 OR ($3::bigint IS NULL AND asset_id IS NULL))
       ORDER BY created_at DESC LIMIT 1`,
      [companyId, currency, assetId ?? null],
    );
    return result.rows[0] || null;
  }

  static async updateConsumed(id: number, newConsumed: string, newPeriodStart?: string): Promise<void> {
    if (newPeriodStart) {
      await pool.query("UPDATE budgets SET consumed_amount = $1, period_start = $2, updated_at = NOW() WHERE id = $3", [
        newConsumed,
        newPeriodStart,
        id,
      ]);
    } else {
      await pool.query("UPDATE budgets SET consumed_amount = $1, updated_at = NOW() WHERE id = $2", [newConsumed, id]);
    }
  }
}
