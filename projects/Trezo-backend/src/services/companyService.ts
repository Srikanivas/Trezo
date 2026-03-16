import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import algosdk from "algosdk";
import { CompanyRepository, CreateCompanyData } from "../repositories/companyRepository";
import { WalletKeyRepository } from "../repositories/walletKeyRepository";
import { AuditLogRepository } from "../repositories/auditLogRepository";
import { KMSService } from "./kmsService";
import { TreasuryService } from "./treasuryService";
import { logger } from "../utils/logger";

export interface RegisterCompanyRequest {
  companyName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    company: {
      id: number;
      companyName: string;
      email: string;
      walletAddress: string;
    };
  };
  error?: string;
}

export interface CompanyProfile {
  id: number;
  companyName: string;
  email: string;
  walletAddress: string;
  createdAt: Date;
}

export class CompanyService {
  /**
   * Register a new company with treasury wallet
   */
  static async register(request: RegisterCompanyRequest): Promise<AuthResponse> {
    try {
      logger.info(`Registering new company: ${request.companyName}`);

      // Check if company already exists
      const existingCompany = await CompanyRepository.findByEmail(request.email);
      if (existingCompany) {
        return {
          success: false,
          error: "Company with this email already exists",
        };
      }

      // Generate new Algorand wallet
      const account = algosdk.generateAccount();
      const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(request.password, saltRounds);

      // Create company record
      const companyData: CreateCompanyData = {
        company_name: request.companyName,
        email: request.email.toLowerCase(),
        password_hash: passwordHash,
        wallet_address: account.addr.toString(),
      };

      const company = await CompanyRepository.create(companyData);

      // Encrypt private key using AWS KMS
      const privateKeyBase64 = Buffer.from(account.sk).toString("base64");
      const encryptedPrivateKey = await KMSService.encrypt(privateKeyBase64);

      // Store encrypted private key
      await WalletKeyRepository.create(company.id, encryptedPrivateKey);

      // Log wallet creation
      await AuditLogRepository.create({
        company_id: company.id,
        operation_type: "WALLET_CREATED",
        wallet_address: account.addr.toString(),
        details: {
          company_name: request.companyName,
          timestamp: new Date().toISOString(),
        },
      });

      // Attempt to fund the wallet (TestNet only)
      if (process.env.ALGOD_NETWORK === "testnet") {
        try {
          await TreasuryService.fundWallet(account.addr.toString());
          logger.info(`Wallet funded successfully: ${account.addr}`);
        } catch (error) {
          logger.warn(`Failed to fund wallet ${account.addr}:`, error);
          // Continue with registration even if funding fails
        }
      }

      // Generate JWT token
      const token = this.generateToken(company.id, company.email);

      logger.info(`Company registered successfully: ${request.companyName} (${account.addr})`);

      return {
        success: true,
        data: {
          token,
          company: {
            id: company.id,
            companyName: company.company_name,
            email: company.email,
            walletAddress: company.wallet_address,
          },
        },
      };
    } catch (error) {
      logger.error("Error registering company:", error);
      return {
        success: false,
        error: "Failed to register company",
      };
    }
  }

  /**
   * Login company
   */
  static async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      logger.info(`Login attempt for email: ${request.email}`);

      // Find company by email
      const company = await CompanyRepository.findByEmail(request.email.toLowerCase());
      if (!company) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(request.password, company.password_hash);
      if (!isValidPassword) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      // Generate JWT token
      const token = this.generateToken(company.id, company.email);

      logger.info(`Company logged in successfully: ${company.company_name}`);

      return {
        success: true,
        data: {
          token,
          company: {
            id: company.id,
            companyName: company.company_name,
            email: company.email,
            walletAddress: company.wallet_address,
          },
        },
      };
    } catch (error) {
      logger.error("Error during login:", error);
      return {
        success: false,
        error: "Login failed",
      };
    }
  }

  /**
   * Get company profile
   */
  static async getProfile(companyId: number): Promise<CompanyProfile | null> {
    try {
      const company = await CompanyRepository.findById(companyId);
      if (!company) {
        return null;
      }

      return {
        id: company.id,
        companyName: company.company_name,
        email: company.email,
        walletAddress: company.wallet_address,
        createdAt: company.created_at,
      };
    } catch (error) {
      logger.error("Error getting company profile:", error);
      throw error;
    }
  }

  /**
   * Verify JWT token and get company ID
   */
  static verifyToken(token: string): { companyId: number; email: string } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return {
        companyId: decoded.companyId,
        email: decoded.email,
      };
    } catch (error) {
      logger.warn("Invalid JWT token:", error);
      return null;
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(companyId: number, email: string): string {
    return jwt.sign({ companyId, email }, process.env.JWT_SECRET!, { expiresIn: "24h" });
  }

  /**
   * Update company password
   */
  static async updatePassword(companyId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const company = await CompanyRepository.findById(companyId);
      if (!company) {
        throw new Error("Company not found");
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, company.password_hash);
      if (!isValidPassword) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await CompanyRepository.update(companyId, { password_hash: newPasswordHash });

      logger.info(`Password updated for company ID: ${companyId}`);
      return true;
    } catch (error) {
      logger.error("Error updating password:", error);
      throw error;
    }
  }
}
