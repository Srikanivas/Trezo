import { pool } from "../config/database";
import { logger } from "../utils/logger";

export interface AuditLog {
  id: number;
  company_id: number;
  operation_type: string;
  wallet_address: string;
  transaction_id?: string;
  amount?: number;
  asset_id?: number;
  recipient_address?: string;
  details?: any;
  created_at: Date;
}

export interface CreateAuditLogData {
  company_id: number;
  operation_type: string;
  wallet_address: string;
  transaction_id?: string;
  amount?: number;
  asset_id?: number;
  recipient_address?: string;
  details?: any;
}

export class AuditLogRepository {
  static async create(data: CreateAuditLogData): Promise<AuditLog> {
    try {
      const result = await pool.query<AuditLog>(
        `INSERT INTO wallet_audit_log
         (company_id, operation_type, wallet_address, transaction_id, amount, asset_id, recipient_address, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          data.company_id,
          data.operation_type,
          data.wallet_address,
          data.transaction_id || null,
          data.amount || null,
          data.asset_id ?? 0,
          data.recipient_address || null,
          data.details ? JSON.stringify(data.details) : null,
        ],
      );
      logger.info(`Audit log created: ${data.operation_type} for company ${data.company_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error("Error creating audit log:", error);
      throw error;
    }
  }

  static async findByCompanyId(companyId: number, limit = 50, offset = 0): Promise<AuditLog[]> {
    try {
      const result = await pool.query<AuditLog>(
        `SELECT * FROM wallet_audit_log WHERE company_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [companyId, limit, offset],
      );
      return result.rows;
    } catch (error) {
      logger.error("Error retrieving audit logs:", error);
      throw error;
    }
  }

  static async findByOperationType(companyId: number, operationType: string, limit = 50): Promise<AuditLog[]> {
    try {
      const result = await pool.query<AuditLog>(
        `SELECT * FROM wallet_audit_log WHERE company_id = $1 AND operation_type = $2
         ORDER BY created_at DESC LIMIT $3`,
        [companyId, operationType, limit],
      );
      return result.rows;
    } catch (error) {
      logger.error("Error retrieving audit logs by operation type:", error);
      throw error;
    }
  }

  static async getRecentTransactions(companyId: number, limit = 20): Promise<AuditLog[]> {
    try {
      const result = await pool.query<AuditLog>(
        `SELECT * FROM wallet_audit_log
         WHERE company_id = $1 AND operation_type IN ('TRANSACTION_SENT', 'TRANSACTION_RECEIVED')
         ORDER BY created_at DESC LIMIT $2`,
        [companyId, limit],
      );
      return result.rows;
    } catch (error) {
      logger.error("Error retrieving recent transactions:", error);
      throw error;
    }
  }
}
