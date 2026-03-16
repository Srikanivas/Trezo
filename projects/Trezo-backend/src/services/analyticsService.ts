import { indexerClient } from "../config/algorand";
import { CompanyRepository } from "../repositories/companyRepository";
import { InvoiceRepository } from "../repositories/invoiceRepository";
import { logger } from "../utils/logger";

export interface AssetAllocation {
  name: string;
  unitName: string;
  assetId: number;
  balance: number;
  percentage: number;
}

export interface TreasurySummary {
  totalTreasuryValue: number;
  algoBalance: number;
  assets: AssetAllocation[];
  recentTransactions: any[];
  pendingInvoicesValue: number;
}

export interface TreasuryAnalytics {
  treasuryValue: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  monthlyPayments: number;
  largestTransactionThisMonth: number;
}

export class AnalyticsService {
  /**
   * Build treasury summary with asset allocation percentages
   */
  static async getTreasurySummary(companyId: number): Promise<TreasurySummary> {
    const company = await CompanyRepository.findById(companyId);
    if (!company) throw new Error("Company not found");

    const address = company.wallet_address;

    // Fetch account info from Algorand
    const { algodClient } = await import("../config/algorand");
    const accountInfo = await algodClient.accountInformation(address).do();

    const algoBalance = Number(accountInfo.amount) / 1_000_000;

    // Fetch asset holdings
    const assetHoldings: AssetAllocation[] = [];
    let totalValue = algoBalance;

    if (accountInfo.assets && accountInfo.assets.length > 0) {
      for (const asset of accountInfo.assets) {
        try {
          const assetInfo = await algodClient.getAssetByID(asset.assetId).do();
          const decimals = Number(assetInfo.params.decimals);
          const balance = Number(asset.amount) / Math.pow(10, decimals);
          // For TestNet we treat 1 unit = 1 ALGO equivalent for simplicity
          totalValue += balance;
          assetHoldings.push({
            name: assetInfo.params.name || `ASA-${asset.assetId}`,
            unitName: assetInfo.params.unitName || "ASA",
            assetId: Number(asset.assetId),
            balance,
            percentage: 0, // calculated below
          });
        } catch {
          logger.warn(`Could not fetch info for asset ${asset.assetId}`);
        }
      }
    }

    // Calculate percentages
    const allAssets: AssetAllocation[] = [
      {
        name: "Algorand",
        unitName: "ALGO",
        assetId: 0,
        balance: algoBalance,
        percentage: totalValue > 0 ? Math.round((algoBalance / totalValue) * 100 * 10) / 10 : 100,
      },
      ...assetHoldings.map((a) => ({
        ...a,
        percentage: totalValue > 0 ? Math.round((a.balance / totalValue) * 100 * 10) / 10 : 0,
      })),
    ];

    // Fetch recent transactions from indexer
    let recentTransactions: any[] = [];
    try {
      const txResponse = await indexerClient.lookupAccountTransactions(address).limit(10).do();
      recentTransactions = (txResponse.transactions || []).map((tx: any) => ({
        id: tx.id,
        sender: tx.sender,
        receiver: tx.paymentTransaction?.receiver || tx.assetTransferTransaction?.receiver,
        amount: Number(tx.paymentTransaction?.amount || tx.assetTransferTransaction?.amount || 0) / 1_000_000,
        type: tx.txType,
        timestamp: Number(tx.roundTime),
        fee: Number(tx.fee) / 1_000_000,
      }));
    } catch (err) {
      logger.warn("Could not fetch recent transactions for summary:", err);
    }

    const pendingInvoicesValue = await InvoiceRepository.getSummary(companyId).then((s) => parseFloat(s.total_payables));

    return {
      totalTreasuryValue: Math.round(totalValue * 1000) / 1000,
      algoBalance,
      assets: allAssets,
      recentTransactions,
      pendingInvoicesValue,
    };
  }

  /**
   * Compute treasury analytics metrics
   */
  static async getAnalytics(companyId: number): Promise<TreasuryAnalytics> {
    const company = await CompanyRepository.findById(companyId);
    if (!company) throw new Error("Company not found");

    const address = company.wallet_address;

    // Treasury value
    const { algodClient } = await import("../config/algorand");
    const accountInfo = await algodClient.accountInformation(address).do();
    const algoBalance = Number(accountInfo.amount) / 1_000_000;

    const invoiceSummary = await InvoiceRepository.getSummary(companyId);
    const pendingInvoices = parseFloat(invoiceSummary.total_payables);
    const monthlyRevenue = parseFloat(invoiceSummary.paid_this_month);

    // Monthly outgoing payments from indexer
    let monthlyPayments = 0;
    let largestTx = 0;
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const txResponse = await indexerClient.lookupAccountTransactions(address).afterTime(startOfMonth.toISOString()).limit(200).do();

      for (const tx of txResponse.transactions || []) {
        if (tx.sender === address && tx.paymentTransaction) {
          const amt = Number(tx.paymentTransaction.amount) / 1_000_000;
          monthlyPayments += amt;
          if (amt > largestTx) largestTx = amt;
        }
      }
    } catch (err) {
      logger.warn("Could not compute monthly analytics:", err);
    }

    return {
      treasuryValue: Math.round(algoBalance * 1000) / 1000,
      pendingInvoices: Math.round(pendingInvoices * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      monthlyPayments: Math.round(monthlyPayments * 1000) / 1000,
      largestTransactionThisMonth: Math.round(largestTx * 1000) / 1000,
    };
  }
}
