import algosdk from "algosdk";
import { WalletInfo, WalletValidationResult } from "../types/wallet";
import { logger } from "../utils/logger";
import { getAddressUrl, getDispenserUrl, NETWORK_INFO } from "../config/explorer";

export class WalletService {
  /**
   * Creates a new Algorand wallet
   * @returns Promise<WalletInfo> - Wallet information including address, mnemonic, and secret key
   */
  static async createWallet(): Promise<WalletInfo> {
    try {
      logger.info("Creating new Algorand wallet");

      // Generate a new account
      const account = algosdk.generateAccount();

      // Convert secret key to mnemonic phrase
      const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

      const walletInfo: WalletInfo = {
        address: account.addr.toString(),
        mnemonic: mnemonic,
        secretKey: account.sk,
      };

      logger.info(`New wallet created with address: ${account.addr}`);

      return walletInfo;
    } catch (error) {
      logger.error("Error creating wallet:", error);
      throw new Error("Failed to create wallet");
    }
  }

  /**
   * Recovers a wallet from mnemonic phrase
   * @param mnemonic - The 25-word mnemonic phrase
   * @returns Promise<Omit<WalletInfo, 'mnemonic'>> - Wallet address and secret key
   */
  static async recoverWallet(mnemonic: string): Promise<Omit<WalletInfo, "mnemonic">> {
    try {
      logger.info("Attempting to recover wallet from mnemonic");

      // Validate and convert mnemonic to secret key
      const secretKey = algosdk.mnemonicToSecretKey(mnemonic.trim());

      const walletInfo = {
        address: secretKey.addr.toString(),
        secretKey: secretKey.sk,
      };

      logger.info(`Wallet recovered successfully with address: ${secretKey.addr}`);

      return walletInfo;
    } catch (error) {
      logger.error("Error recovering wallet:", error);
      throw new Error("Invalid mnemonic phrase");
    }
  }

  /**
   * Validates a mnemonic phrase
   * @param mnemonic - The mnemonic phrase to validate
   * @returns Promise<WalletValidationResult> - Validation result
   */
  static async validateMnemonic(mnemonic: string): Promise<WalletValidationResult> {
    try {
      const trimmedMnemonic = mnemonic.trim();

      // Check if mnemonic has correct word count (should be 25 words)
      const words = trimmedMnemonic.split(" ").filter((word) => word.length > 0);
      if (words.length !== 25) {
        return {
          isValid: false,
          error: "Mnemonic must contain exactly 25 words",
        };
      }

      // Try to convert mnemonic to secret key
      const secretKey = algosdk.mnemonicToSecretKey(trimmedMnemonic);

      return {
        isValid: true,
        address: secretKey.addr.toString(),
      };
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid mnemonic phrase",
      };
    }
  }

  /**
   * Validates an Algorand address
   * @param address - The address to validate
   * @returns boolean - True if valid, false otherwise
   */
  static validateAddress(address: string): boolean {
    try {
      return algosdk.isValidAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets account information from the blockchain
   * @param address - The account address
   * @returns Promise<any> - Account information
   */
  static async getAccountInfo(address: string): Promise<any> {
    try {
      if (!this.validateAddress(address)) {
        throw new Error("Invalid address format");
      }

      logger.info(`Getting account info for address: ${address}`);

      // For TestNet, provide helpful account information
      const network = process.env.ALGOD_NETWORK || "testnet";

      const accountInfo = {
        address,
        network,
        status: "Account created successfully",
        explorerUrl: getAddressUrl(address),
        dispenserUrl: getDispenserUrl(),
        note:
          network === "testnet"
            ? `This is a valid ${NETWORK_INFO.name} address. Fund it using the ${NETWORK_INFO.name} dispenser to start transacting.`
            : "This is a valid MainNet address. Fund it with real ALGO to start transacting.",
        fundingInstructions:
          network === "testnet"
            ? `Visit the ${NETWORK_INFO.name} dispenser to get free test ALGO tokens`
            : "Purchase ALGO from a cryptocurrency exchange to fund this address",
      };

      return accountInfo;
    } catch (error) {
      logger.error("Error getting account info:", error);
      throw error;
    }
  }
}
