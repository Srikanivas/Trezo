import { Request, Response } from "express";
import { TreasuryService, SendTransactionRequest } from "../services/treasuryService";
import { CompanyRepository } from "../repositories/companyRepository";
import { AuditLogRepository } from "../repositories/auditLogRepository";
import { logger } from "../utils/logger";
import { getTransactionUrl } from "../config/explorer";

export class TreasuryController {
  /**
   * GET /api/v1/treasury/balance/:companyId
   * Get treasury wallet balance and assets
   */
  static async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params.companyId);
      const requestingCompanyId = (req as any).companyId; // From auth middleware

      // Ensure company can only access their own treasury
      if (companyId !== requestingCompanyId) {
        res.status(403).json({
          success: false,
          error: "Access denied",
        });
        return;
      }

      // Get company and wallet address
      const company = await CompanyRepository.findById(companyId);
      if (!company) {
        res.status(404).json({
          success: false,
          error: "Company not found",
        });
        return;
      }

      const balance = await TreasuryService.getWalletBalance(company.wallet_address, companyId);

      res.status(200).json({
        success: true,
        data: balance,
      });
    } catch (error) {
      logger.error("Error getting treasury balance:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve treasury balance",
      });
    }
  }

  /**
   * GET /api/v1/treasury/transactions/:companyId
   * Get treasury transaction history
   */
  static async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params.companyId);
      const requestingCompanyId = (req as any).companyId; // From auth middleware

      // Ensure company can only access their own transactions
      if (companyId !== requestingCompanyId) {
        res.status(403).json({
          success: false,
          error: "Access denied",
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const nextToken = req.query.nextToken as string;

      // Get company and wallet address
      const company = await CompanyRepository.findById(companyId);
      if (!company) {
        res.status(404).json({
          success: false,
          error: "Company not found",
        });
        return;
      }

      const transactions = await TreasuryService.getTransactionHistory(company.wallet_address, companyId, limit, nextToken);

      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      logger.error("Error getting treasury transactions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve transaction history",
      });
    }
  }

  /**
   * POST /api/v1/treasury/send
   * Send transaction from treasury wallet
   */
  static async sendTransaction(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId; // From auth middleware
      const { receiverAddress, amount, assetId, note } = req.body;

      // Validate required fields
      if (!receiverAddress || amount === undefined || amount <= 0) {
        res.status(400).json({
          success: false,
          error: "Receiver address and positive amount are required",
        });
        return;
      }

      // Validate receiver address
      if (!TreasuryService.validateAddress(receiverAddress)) {
        res.status(400).json({
          success: false,
          error: "Invalid receiver address",
        });
        return;
      }

      // Validate asset ID if provided
      if (assetId && assetId < 0) {
        res.status(400).json({
          success: false,
          error: "Invalid asset ID",
        });
        return;
      }

      const sendRequest: SendTransactionRequest = {
        companyId,
        receiverAddress,
        amount,
        assetId: assetId || 0,
        note,
      };

      const transactionId = await TreasuryService.sendTransaction(sendRequest);

      res.status(200).json({
        success: true,
        data: {
          transactionId,
          explorerUrl: getTransactionUrl(transactionId),
        },
      });
    } catch (error) {
      logger.error("Error sending transaction:", error);

      let errorMessage = "Failed to send transaction";
      if (error instanceof Error) {
        if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds in treasury wallet";
        } else if (error.message.includes("asset not found")) {
          errorMessage = "Asset not found or not opted in";
        }
      }

      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  /**
   * GET /api/v1/treasury/audit/:companyId
   * Get audit log for treasury operations
   */
  static async getAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const companyId = parseInt(req.params.companyId);
      const requestingCompanyId = (req as any).companyId; // From auth middleware

      // Ensure company can only access their own audit log
      if (companyId !== requestingCompanyId) {
        res.status(403).json({
          success: false,
          error: "Access denied",
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const operationType = req.query.operationType as string;

      let auditLogs;
      if (operationType) {
        auditLogs = await AuditLogRepository.findByOperationType(companyId, operationType, limit);
      } else {
        auditLogs = await AuditLogRepository.findByCompanyId(companyId, limit, offset);
      }

      res.status(200).json({
        success: true,
        data: auditLogs,
      });
    } catch (error) {
      logger.error("Error getting audit log:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve audit log",
      });
    }
  }

  /**
   * POST /api/v1/treasury/optin
   * Opt-in treasury wallet to an ASA
   */
  static async optInAsset(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const { assetId } = req.body;

      if (!assetId || isNaN(parseInt(assetId)) || parseInt(assetId) <= 0) {
        res.status(400).json({ success: false, error: "Valid assetId is required" });
        return;
      }

      const txId = await TreasuryService.optInAsset(companyId, parseInt(assetId));

      res.status(200).json({
        success: true,
        data: { transactionId: txId, explorerUrl: getTransactionUrl(txId) },
      });
    } catch (error: any) {
      logger.error("Error opting in to asset:", error);
      res.status(error?.status ?? 400).json({ success: false, error: error.message || "Failed to opt in to asset" });
    }
  }

  /**
   * GET /api/v1/treasury/asset/:assetId
   * Get asset information
   */
  static async getAssetInfo(req: Request, res: Response): Promise<void> {
    try {
      const assetId = parseInt(req.params.assetId);

      if (assetId <= 0) {
        res.status(400).json({
          success: false,
          error: "Invalid asset ID",
        });
        return;
      }

      const assetInfo = await TreasuryService.getAssetInfo(assetId);

      res.status(200).json({
        success: true,
        data: assetInfo,
      });
    } catch (error) {
      logger.error("Error getting asset info:", error);
      res.status(404).json({
        success: false,
        error: "Asset not found",
      });
    }
  }
}
