import { pool } from "../config/database";
import { logger } from "../utils/logger";

export interface WalletKey {
  id: number;
  company_id: number;
  encrypted_private_key: string;
  created_at: Date;
}

export class WalletKeyRepository {
  static async create(companyId: number, encryptedPrivateKey: string): Promise<WalletKey> {
    try {
      const result = await pool.query<WalletKey>(
        `INSERT INTO company_wallet_keys (company_id, encrypted_private_key)
         VALUES ($1, $2) RETURNING *`,
        [companyId, encryptedPrivateKey],
      );
      logger.info(`Encrypted private key stored for company ID: ${companyId}`);
      return result.rows[0];
    } catch (error) {
      logger.error("Error storing encrypted private key:", error);
      throw error;
    }
  }

  static async findByCompanyId(companyId: number): Promise<WalletKey | null> {
    try {
      const result = await pool.query<WalletKey>("SELECT * FROM company_wallet_keys WHERE company_id = $1", [companyId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error retrieving encrypted private key:", error);
      throw error;
    }
  }

  static async update(companyId: number, encryptedPrivateKey: string): Promise<WalletKey | null> {
    try {
      const result = await pool.query<WalletKey>(
        `UPDATE company_wallet_keys SET encrypted_private_key = $1
         WHERE company_id = $2 RETURNING *`,
        [encryptedPrivateKey, companyId],
      );
      if (result.rows[0]) logger.info(`Encrypted private key updated for company ID: ${companyId}`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error updating encrypted private key:", error);
      throw error;
    }
  }

  static async delete(companyId: number): Promise<boolean> {
    try {
      const result = await pool.query("DELETE FROM company_wallet_keys WHERE company_id = $1", [companyId]);
      const deleted = (result.rowCount ?? 0) > 0;
      if (deleted) logger.info(`Encrypted private key deleted for company ID: ${companyId}`);
      return deleted;
    } catch (error) {
      logger.error("Error deleting encrypted private key:", error);
      throw error;
    }
  }
}
