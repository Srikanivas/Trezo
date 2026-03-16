import { Request, Response } from "express";
import { CompanyService, RegisterCompanyRequest, LoginRequest } from "../services/companyService";
import { logger } from "../utils/logger";

export class CompanyController {
  /**
   * POST /api/v1/company/register
   * Register a new company with treasury wallet
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { companyName, email, password }: RegisterCompanyRequest = req.body;

      // Validate required fields
      if (!companyName || !email || !password) {
        res.status(400).json({
          success: false,
          error: "Company name, email, and password are required",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: "Password must be at least 8 characters long",
        });
        return;
      }

      const result = await CompanyService.register({ companyName, email, password });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error("Error in company registration:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * POST /api/v1/company/login
   * Login company
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
        return;
      }

      const result = await CompanyService.login({ email, password });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      logger.error("Error in company login:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * GET /api/v1/company/profile
   * Get company profile (requires authentication)
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId; // Set by auth middleware

      const profile = await CompanyService.getProfile(companyId);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: "Company not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      logger.error("Error getting company profile:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * PUT /api/v1/company/password
   * Update company password (requires authentication)
   */
  static async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId; // Set by auth middleware
      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: "Current password and new password are required",
        });
        return;
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: "New password must be at least 8 characters long",
        });
        return;
      }

      await CompanyService.updatePassword(companyId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      logger.error("Error updating password:", error);

      if (error instanceof Error && error.message === "Current password is incorrect") {
        res.status(400).json({
          success: false,
          error: "Current password is incorrect",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Internal server error",
        });
      }
    }
  }

  /**
   * GET /api/v1/companies/search?q=
   * Search companies by name (min 2 chars), excludes requesting company
   */
  static async searchCompanies(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const q = (req.query.q as string) ?? "";
      if (q.trim().length < 2) {
        res.status(400).json({ success: false, error: "Query must be at least 2 characters" });
        return;
      }
      const { CompanyRepository } = await import("../repositories/companyRepository");
      const results = await CompanyRepository.searchByName(q.trim(), companyId);
      res.status(200).json({ success: true, data: results });
    } catch (error) {
      logger.error("Error searching companies:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}
