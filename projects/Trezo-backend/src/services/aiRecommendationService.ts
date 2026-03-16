import { AnalyticsService, AssetAllocation } from "./analyticsService";
import { MarketDataService } from "./marketDataService";
import { InvoiceRepository } from "../repositories/invoiceRepository";
import { PaymentRepository } from "../repositories/paymentRepository";
import { logger } from "../utils/logger";

export interface AIRecommendation {
  type:
    | "LIQUIDITY"
    | "CONCENTRATION"
    | "IDLE_CAPITAL"
    | "INVOICE_REMINDER"
    | "LARGE_TX_ALERT"
    | "MARKET_VOLATILITY"
    | "DIVERSIFICATION"
    | "HEALTHY";
  severity: "warning" | "info" | "success";
  message: string;
  recommendation: string;
}

export interface AITreasuryData {
  totalTreasuryValue: number;
  totalTreasuryValueUSD: number;
  assets: AssetAllocation[];
  pendingInvoices: Array<{ id: number; amount: string; currency: string; senderName: string; createdAt: string }>;
  scheduledPayments: Array<{ id: number; amount: string; asset_type: string; receiver_address: string; created_at: string }>;
  recentTransactions: any[];
  marketPrices: Array<{ symbol: string; usdPrice: number; change24h: number | null }>;
}

// Thresholds
const STABLECOIN_LOW_PCT = 20; // % below which stablecoin liquidity is "low"
const CONCENTRATION_PCT = 60; // % above which single-asset is "concentrated"
const IDLE_ALGO_THRESHOLD = 500; // ALGO above which funds are "idle" if no other assets
const LARGE_TX_ALGO = 1000; // ALGO equivalent for "large transaction" alert
const INVOICE_DUE_DAYS = 3; // days until invoice is "due soon"
const VOLATILITY_THRESHOLD = 10; // % 24h change considered "high volatility"

export class AIRecommendationService {
  static async getAITreasuryData(companyId: number): Promise<AITreasuryData> {
    const [summary, invoiceSummaryRaw, recentPayments, marketPrices] = await Promise.all([
      AnalyticsService.getTreasurySummary(companyId),
      InvoiceRepository.findInbox(companyId, { direction: "received", status: "pending_approval", limit: 50 }),
      PaymentRepository.findByCompanyId(companyId, 10, 0),
      MarketDataService.getPrices(),
    ]);

    // Compute USD value using market prices
    const algoPrice = marketPrices.find((p) => p.symbol === "ALGO")?.usdPrice ?? 0;
    const totalUSD = summary.assets.reduce((acc, a) => {
      const price =
        marketPrices.find((p) => p.symbol.toUpperCase() === a.unitName.toUpperCase())?.usdPrice ?? (a.assetId === 0 ? algoPrice : 0);
      return acc + a.balance * price;
    }, 0);

    const pendingInvoices = invoiceSummaryRaw.map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      currency: inv.currency,
      senderName: inv.sender_company_name,
      createdAt: inv.created_at,
    }));

    const scheduledPayments = recentPayments
      .filter((p) => p.status === "pending")
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        asset_type: p.asset_type,
        receiver_address: p.receiver_address,
        created_at: p.created_at,
      }));

    return {
      totalTreasuryValue: summary.totalTreasuryValue,
      totalTreasuryValueUSD: Math.round(totalUSD * 100) / 100,
      assets: summary.assets,
      pendingInvoices,
      scheduledPayments,
      recentTransactions: summary.recentTransactions,
      marketPrices: marketPrices.map((p) => ({ symbol: p.symbol, usdPrice: p.usdPrice, change24h: p.change24h })),
    };
  }

  static async getRecommendations(companyId: number): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    try {
      const data = await this.getAITreasuryData(companyId);
      const { assets, pendingInvoices, scheduledPayments, recentTransactions, marketPrices } = data;

      const totalBalance = assets.reduce((s, a) => s + a.balance, 0);

      // ── Rule 1: Stablecoin Liquidity Risk ─────────────────────────────────
      const stablecoins = assets.filter((a) => ["USDC", "USDT"].includes(a.unitName.toUpperCase()));
      const stablePct = stablecoins.reduce((s, a) => s + a.percentage, 0);
      const hasUpcomingPayments = scheduledPayments.length > 0 || pendingInvoices.length > 0;

      if (stablePct < STABLECOIN_LOW_PCT && hasUpcomingPayments && assets.length > 1) {
        recommendations.push({
          type: "LIQUIDITY",
          severity: "warning",
          message: `Your stablecoin liquidity is low at ${stablePct.toFixed(1)}% of treasury.`,
          recommendation: `Consider swapping ${Math.round((10 * (STABLECOIN_LOW_PCT - stablePct)) / STABLECOIN_LOW_PCT)}% of ALGO into USDC to cover upcoming payment obligations.`,
        });
      }

      // ── Rule 2: Asset Concentration Risk ──────────────────────────────────
      for (const asset of assets) {
        if (asset.percentage > CONCENTRATION_PCT) {
          recommendations.push({
            type: "CONCENTRATION",
            severity: "warning",
            message: `Your treasury is ${asset.percentage.toFixed(1)}% concentrated in ${asset.unitName}.`,
            recommendation: `Diversify by allocating a portion into stablecoins or other assets to reduce single-asset exposure.`,
          });
          break; // one concentration warning is enough
        }
      }

      // ── Rule 3: Idle Capital ───────────────────────────────────────────────
      const algoAsset = assets.find((a) => a.assetId === 0);
      if (algoAsset && algoAsset.balance > IDLE_ALGO_THRESHOLD && assets.length === 1) {
        recommendations.push({
          type: "IDLE_CAPITAL",
          severity: "info",
          message: `You have ${algoAsset.balance.toFixed(2)} ALGO sitting idle with no other asset positions.`,
          recommendation: `Consider deploying idle funds into yield strategies, staking, or diversifying into stablecoins.`,
        });
      }

      // ── Rule 4: Invoice Collection Reminder ───────────────────────────────
      for (const invoice of pendingInvoices) {
        const daysPending = Math.ceil((Date.now() - new Date(invoice.createdAt).getTime()) / 86_400_000);
        if (daysPending >= INVOICE_DUE_DAYS) {
          recommendations.push({
            type: "INVOICE_REMINDER",
            severity: "warning",
            message: `Invoice from ${invoice.senderName} (${invoice.amount} ${invoice.currency}) has been awaiting approval for ${daysPending} day(s).`,
            recommendation: `Review and approve or reject this invoice to keep your payables current.`,
          });
        }
      }

      // ── Rule 5: Large Transaction Alert ───────────────────────────────────
      const largeTxs = recentTransactions.filter((tx: any) => tx.amount > LARGE_TX_ALGO);
      if (largeTxs.length > 0) {
        const largest = largeTxs[0];
        recommendations.push({
          type: "LARGE_TX_ALERT",
          severity: "warning",
          message: `A large transaction of ${largest.amount.toFixed(2)} ALGO was detected recently.`,
          recommendation: `Verify this transaction in your audit log to ensure it was authorized.`,
        });
      }

      // ── Rule 6: Market Volatility Alert ───────────────────────────────────
      const algoPrice = marketPrices.find((p) => p.symbol === "ALGO");
      if (algoPrice?.change24h !== null && algoPrice?.change24h !== undefined && Math.abs(algoPrice.change24h) > VOLATILITY_THRESHOLD) {
        const direction = algoPrice.change24h > 0 ? "up" : "down";
        recommendations.push({
          type: "MARKET_VOLATILITY",
          severity: "info",
          message: `ALGO price moved ${direction} ${Math.abs(algoPrice.change24h).toFixed(1)}% in the last 24 hours.`,
          recommendation:
            algoPrice.change24h < 0
              ? `Consider holding stablecoins to reduce exposure during market downturns.`
              : `Strong ALGO performance — review if rebalancing into stablecoins makes sense for your obligations.`,
        });
      }

      // ── Rule 7: Diversification Opportunity ───────────────────────────────
      if (assets.length === 1 && algoAsset && algoAsset.balance > 100 && pendingInvoices.length === 0) {
        recommendations.push({
          type: "DIVERSIFICATION",
          severity: "info",
          message: `Your treasury holds only ALGO with no stablecoin positions.`,
          recommendation: `Adding USDC or USDT positions can reduce volatility risk and improve payment readiness.`,
        });
      }

      // ── Rule 8: Healthy Treasury ──────────────────────────────────────────
      if (recommendations.length === 0) {
        recommendations.push({
          type: "HEALTHY",
          severity: "success",
          message: `Your treasury is well-balanced with healthy liquidity and no outstanding risks.`,
          recommendation: `Continue monitoring your asset allocation and invoice pipeline regularly.`,
        });
      }
    } catch (err) {
      logger.error("AIRecommendationService error:", err);
      recommendations.push({
        type: "HEALTHY",
        severity: "info",
        message: `Unable to generate AI insights at this time.`,
        recommendation: `Please try again in a moment.`,
      });
    }

    return recommendations;
  }
}
