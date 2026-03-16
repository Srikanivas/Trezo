import algosdk from "algosdk";
import axios from "axios";
import { algodClient, indexerClient } from "../config/algorand";
import { KMSService } from "./kmsService";
import { WalletKeyRepository } from "../repositories/walletKeyRepository";
import { AuditLogRepository } from "../repositories/auditLogRepository";
import { logger } from "../utils/logger";

export interface WalletBalance {
  address: string;
  algoBalance: number; // in ALGO (not microAlgos)
  assets: AssetHolding[];
  totalValueUSD?: number;
}

export interface AssetHolding {
  assetId: number;
  amount: number;
  decimals: number;
  name?: string;
  unitName?: string;
  url?: string;
}

export interface TransactionHistory {
  transactions: AlgorandTransaction[];
  nextToken?: string;
}

export interface AlgorandTransaction {
  id: string;
  sender: string;
  receiver?: string;
  amount: number;
  assetId?: number;
  type: string;
  timestamp: number;
  fee: number;
  note?: string;
}

export interface SendTransactionRequest {
  companyId: number;
  receiverAddress: string;
  amount: number; // in ALGO or asset units
  assetId?: number; // 0 or undefined for ALGO
  note?: string;
}

export class TreasuryService {
  /**
   * Get wallet balance and asset holdings
   */
  static async getWalletBalance(address: string, companyId: number): Promise<WalletBalance> {
    try {
      logger.info(`Getting balance for wallet: ${address}`);

      // Log the balance check operation
      await AuditLogRepository.create({
        company_id: companyId,
        operation_type: "BALANCE_CHECKED",
        wallet_address: address,
        details: { timestamp: new Date().toISOString() },
      });

      const accountInfo = await algodClient.accountInformation(address).do();

      // Convert microAlgos to ALGO
      const algoBalance = Number(accountInfo.amount) / 1000000;

      // Process asset holdings
      const assets: AssetHolding[] = [];
      if (accountInfo.assets) {
        for (const asset of accountInfo.assets) {
          try {
            const assetInfo = await algodClient.getAssetByID(asset.assetId).do();
            assets.push({
              assetId: Number(asset.assetId),
              amount: Number(asset.amount) / Math.pow(10, Number(assetInfo.params.decimals)),
              decimals: Number(assetInfo.params.decimals),
              name: assetInfo.params.name,
              unitName: assetInfo.params.unitName,
              url: assetInfo.params.url,
            });
          } catch (error) {
            logger.warn(`Failed to get info for asset ${asset.assetId}:`, error);
            assets.push({
              assetId: Number(asset.assetId),
              amount: Number(asset.amount),
              decimals: 0,
            });
          }
        }
      }

      return {
        address,
        algoBalance,
        assets,
      };
    } catch (error) {
      logger.error("Error getting wallet balance:", error);
      throw new Error("Failed to retrieve wallet balance");
    }
  }

  /**
   * Get transaction history for a wallet
   */
  static async getTransactionHistory(
    address: string,
    companyId: number,
    limit: number = 50,
    nextToken?: string,
  ): Promise<TransactionHistory> {
    try {
      logger.info(`Getting transaction history for wallet: ${address}`);

      let query = indexerClient.lookupAccountTransactions(address).limit(limit);

      if (nextToken) {
        query = query.nextToken(nextToken);
      }

      const response = await query.do();

      const transactions: AlgorandTransaction[] = response.transactions.map((tx: any) => ({
        id: tx.id,
        sender: tx.sender,
        receiver: tx.paymentTransaction?.receiver || tx.assetTransferTransaction?.receiver,
        amount: Number(tx.paymentTransaction?.amount || tx.assetTransferTransaction?.amount || 0),
        assetId: Number(tx.assetTransferTransaction?.assetId || 0),
        type: tx.txType,
        timestamp: Number(tx.roundTime),
        fee: Number(tx.fee),
        note: tx.note ? Buffer.from(tx.note, "base64").toString() : undefined,
      }));

      return {
        transactions,
        nextToken: response.nextToken ? String(response.nextToken) : undefined,
      };
    } catch (error) {
      logger.error("Error getting transaction history:", error);
      throw new Error("Failed to retrieve transaction history");
    }
  }

  /**
   * Send a transaction from the company's treasury wallet
   */
  static async sendTransaction(request: SendTransactionRequest): Promise<string> {
    try {
      logger.info(`Sending transaction for company ${request.companyId}`);

      // Get encrypted private key
      logger.info(`Looking for wallet key for company ID: ${request.companyId}`);
      const walletKey = await WalletKeyRepository.findByCompanyId(request.companyId);
      if (!walletKey) {
        logger.error(`No wallet key found for company ID: ${request.companyId}`);
        throw new Error("Wallet private key not found");
      }
      logger.info(`Found wallet key for company ID: ${request.companyId}`);

      // Decrypt private key using KMS
      const decryptedPrivateKey = await KMSService.decrypt(walletKey.encrypted_private_key);
      const secretKey = new Uint8Array(Buffer.from(decryptedPrivateKey, "base64"));
      const senderAccount = algosdk.mnemonicToSecretKey(algosdk.secretKeyToMnemonic(secretKey));

      // Get suggested transaction parameters
      const suggestedParams = await algodClient.getTransactionParams().do();

      let transaction: algosdk.Transaction;

      if (!request.assetId || request.assetId === 0) {
        // ALGO transaction
        const amountInMicroAlgos = Math.round(request.amount * 1000000);
        transaction = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          sender: senderAccount.addr,
          receiver: request.receiverAddress,
          amount: amountInMicroAlgos,
          suggestedParams,
          note: request.note ? new Uint8Array(Buffer.from(request.note)) : undefined,
        });
      } else {
        // Asset transaction
        const assetInfo = await algodClient.getAssetByID(request.assetId).do();
        const amountInBaseUnits = Math.round(request.amount * Math.pow(10, assetInfo.params.decimals));

        transaction = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: senderAccount.addr,
          receiver: request.receiverAddress,
          amount: amountInBaseUnits,
          assetIndex: request.assetId,
          suggestedParams,
          note: request.note ? new Uint8Array(Buffer.from(request.note)) : undefined,
        });
      }

      // Sign the transaction
      const signedTransaction = transaction.signTxn(senderAccount.sk);

      // Submit the transaction
      const response = await algodClient.sendRawTransaction(signedTransaction).do();
      const txId = response.txid;

      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // Log the transaction
      await AuditLogRepository.create({
        company_id: request.companyId,
        operation_type: "TRANSACTION_SENT",
        wallet_address: senderAccount.addr.toString(),
        transaction_id: txId,
        amount: request.assetId ? Math.round(request.amount * Math.pow(10, 6)) : Math.round(request.amount * 1000000),
        asset_id: request.assetId || 0,
        recipient_address: request.receiverAddress,
        details: {
          note: request.note,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info(`Transaction sent successfully: ${txId}`);
      return txId;
    } catch (error) {
      logger.error("Error sending transaction:", error);
      throw new Error("Failed to send transaction");
    }
  }

  /**
   * Fund a new wallet using TestNet faucet
   */
  static async fundWallet(address: string): Promise<boolean> {
    try {
      logger.info(`Funding wallet ${address} using TestNet faucet`);

      // Try multiple faucet endpoints
      const faucetUrls = [
        "https://lora.algokit.io/testnet/dispenser",
        "https://bank.testnet.algorand.network",
        "https://testnet-api.algonode.cloud/v2/accounts/" + address + "/fund",
      ];

      for (const faucetUrl of faucetUrls) {
        try {
          let response;

          if (faucetUrl.includes("algonode.cloud")) {
            // AlgoNode faucet format
            response = await axios.post(
              faucetUrl,
              {},
              {
                timeout: 30000,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          } else {
            // Standard faucet format
            response = await axios.post(
              faucetUrl,
              {
                address: address,
              },
              {
                timeout: 30000,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
          }

          if (response.status === 200) {
            logger.info(`Successfully funded wallet ${address} using ${faucetUrl}`);
            return true;
          }
        } catch (error) {
          logger.warn(`Faucet ${faucetUrl} failed:`, error);
          continue;
        }
      }

      logger.warn(`All faucet attempts failed for wallet ${address}`);
      return false;
    } catch (error) {
      logger.error("Error funding wallet:", error);
      return false;
    }
  }

  /**
   * Opt-in to an ASA (Asset Standard Asset) from the company's treasury wallet.
   * An opt-in is a zero-amount asset transfer from the wallet to itself.
   */
  static async optInAsset(companyId: number, assetId: number): Promise<string> {
    try {
      logger.info(`Opting in to asset ${assetId} for company ${companyId}`);

      const walletKey = await WalletKeyRepository.findByCompanyId(companyId);
      if (!walletKey) throw new Error("Wallet private key not found");

      const decryptedPrivateKey = await KMSService.decrypt(walletKey.encrypted_private_key);
      const secretKey = new Uint8Array(Buffer.from(decryptedPrivateKey, "base64"));
      const account = algosdk.mnemonicToSecretKey(algosdk.secretKeyToMnemonic(secretKey));

      // Verify asset exists
      const assetInfo = await algodClient.getAssetByID(assetId).do();

      const suggestedParams = await algodClient.getTransactionParams().do();

      // Opt-in = zero-amount asset transfer to self
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account.addr,
        receiver: account.addr,
        amount: 0,
        assetIndex: assetId,
        suggestedParams,
        note: new Uint8Array(Buffer.from(`TREZO_OPTIN_${assetId}`)),
      });

      const signedTxn = txn.signTxn(account.sk);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = response.txid;

      await algosdk.waitForConfirmation(algodClient, txId, 4);

      await AuditLogRepository.create({
        company_id: companyId,
        operation_type: "ASSET_OPTIN",
        wallet_address: account.addr.toString(),
        transaction_id: txId,
        asset_id: assetId,
        details: {
          asset_name: assetInfo.params.name,
          unit_name: assetInfo.params.unitName,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info(`Asset opt-in successful: assetId=${assetId}, txId=${txId}`);
      return txId;
    } catch (error: any) {
      logger.error(`Error opting in to asset ${assetId}:`, error);
      // Surface meaningful errors
      if (error?.message?.includes("already opted in") || error?.message?.includes("asset already exists")) {
        throw Object.assign(new Error("Wallet is already opted in to this asset"), { status: 400 });
      }
      throw new Error(error?.message || "Failed to opt in to asset");
    }
  }
  static validateAddress(address: string): boolean {
    try {
      return algosdk.isValidAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Get asset information
   */
  static async getAssetInfo(assetId: number): Promise<any> {
    try {
      const assetInfo = await algodClient.getAssetByID(assetId).do();
      return {
        id: assetId,
        name: assetInfo.params.name,
        unitName: assetInfo.params.unitName,
        decimals: Number(assetInfo.params.decimals),
        total: Number(assetInfo.params.total),
        url: assetInfo.params.url,
        creator: assetInfo.params.creator,
      };
    } catch (error) {
      logger.error(`Error getting asset info for ${assetId}:`, error);
      throw new Error("Asset not found");
    }
  }
}
