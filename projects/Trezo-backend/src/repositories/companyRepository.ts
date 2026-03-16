import { pool } from "../config/database";
import { logger } from "../utils/logger";

export interface Company {
  id: number;
  company_name: string;
  email: string;
  password_hash: string;
  wallet_address: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCompanyData {
  company_name: string;
  email: string;
  password_hash: string;
  wallet_address: string;
}

export class CompanyRepository {
  static async create(data: CreateCompanyData): Promise<Company> {
    try {
      const result = await pool.query<Company>(
        `INSERT INTO companies (company_name, email, password_hash, wallet_address)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.company_name, data.email, data.password_hash, data.wallet_address],
      );
      logger.info(`Company created: ${data.company_name} (${data.email})`);
      return result.rows[0];
    } catch (error) {
      logger.error("Error creating company:", error);
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<Company | null> {
    try {
      const result = await pool.query<Company>("SELECT * FROM companies WHERE email = $1", [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding company by email:", error);
      throw error;
    }
  }

  static async findById(id: number): Promise<Company | null> {
    try {
      const result = await pool.query<Company>("SELECT * FROM companies WHERE id = $1", [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding company by ID:", error);
      throw error;
    }
  }

  static async findByWalletAddress(walletAddress: string): Promise<Company | null> {
    try {
      const result = await pool.query<Company>("SELECT * FROM companies WHERE wallet_address = $1", [walletAddress]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding company by wallet address:", error);
      throw error;
    }
  }

  static async update(id: number, updates: Partial<CreateCompanyData>): Promise<Company | null> {
    try {
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const result = await pool.query<Company>(
        `UPDATE companies SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );
      if (result.rows[0]) logger.info(`Company updated: ID ${id}`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error updating company:", error);
      throw error;
    }
  }

  static async searchByName(query: string, excludeCompanyId: number): Promise<Pick<Company, "id" | "company_name" | "wallet_address">[]> {
    const result = await pool.query<Pick<Company, "id" | "company_name" | "wallet_address">>(
      `SELECT id, company_name, wallet_address FROM companies
       WHERE company_name ILIKE $1 AND id <> $2
       ORDER BY company_name ASC LIMIT 20`,
      [`%${query}%`, excludeCompanyId],
    );
    return result.rows;
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query("DELETE FROM companies WHERE id = $1", [id]);
      const deleted = (result.rowCount ?? 0) > 0;
      if (deleted) logger.info(`Company deleted: ID ${id}`);
      return deleted;
    } catch (error) {
      logger.error("Error deleting company:", error);
      throw error;
    }
  }
}
