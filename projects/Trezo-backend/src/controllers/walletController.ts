import { Request, Response } from "express";
import { WalletService } from "../services/walletService";
import { CreateWalletResponse, RecoverWalletRequest, RecoverWalletResponse } from "../types/wallet";
import { logger } from "../utils/logger";
import { validateRecoverWalletRequest } from "../middleware/validation";

export class WalletController {
  /**
   * POST /api/v1/wallet/create
   * Creates a new Algorand wallet
   */
  static async createWallet(req: Request, res: Response): Promise<void> {
    try {
      logger.info("Received request to create new wallet");

      const walletInfo = await WalletService.createWallet();

      const response: CreateWalletResponse = {
        success: true,
        data: {
          address: walletInfo.address,
          mnemonic: walletInfo.mnemonic,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error("Error in createWallet controller:", error);

      const response: CreateWalletResponse = {
        success: false,
        error: "Failed to create wallet",
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/v1/wallet/recover
   * Recovers a wallet from mnemonic phrase
   */
  static async recoverWallet(req: Request, res: Response): Promise<void> {
    try {
      const { mnemonic }: RecoverWalletRequest = req.body;

      logger.info("Received request to recover wallet");

      const walletInfo = await WalletService.recoverWallet(mnemonic);

      const response: RecoverWalletResponse = {
        success: true,
        data: {
          address: walletInfo.address,
          isValid: true,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error("Error in recoverWallet controller:", error);

      const response: RecoverWalletResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Failed to recover wallet",
      };

      res.status(400).json(response);
    }
  }

  /**
   * POST /api/v1/wallet/validate
   * Validates a mnemonic phrase
   */
  static async validateMnemonic(req: Request, res: Response): Promise<void> {
    try {
      const { mnemonic } = req.body;

      if (!mnemonic || typeof mnemonic !== "string") {
        res.status(400).json({
          success: false,
          error: "Mnemonic is required and must be a string",
        });
        return;
      }

      const validation = await WalletService.validateMnemonic(mnemonic);

      res.status(200).json({
        success: true,
        data: validation,
      });
    } catch (error) {
      logger.error("Error in validateMnemonic controller:", error);

      res.status(500).json({
        success: false,
        error: "Failed to validate mnemonic",
      });
    }
  }

  /**
   * GET /api/v1/wallet/account/:address
   * Gets account information for an address
   */
  static async getAccountInfo(req: Request, res: Response): Promise<void> {
    try {
      const { address } = req.params;

      if (!WalletService.validateAddress(address)) {
        res.status(400).json({
          success: false,
          error: "Invalid address format",
        });
        return;
      }

      const accountInfo = await WalletService.getAccountInfo(address);

      res.status(200).json({
        success: true,
        data: accountInfo,
      });
    } catch (error) {
      logger.error("Error in getAccountInfo controller:", error);

      res.status(500).json({
        success: false,
        error: "Failed to get account information",
      });
    }
  }
}
