import { AnalyticsService, AssetAllocation } from "./analyticsService";
import { InvoiceRepository } from "../repositories/invoiceRepository";
import { logger } from "../utils/logger";

export interface Recommendation {
  type: "warning" | "info" | "success";
  message: string;
}

const IDLE_THRESHOLD_ALGO = 100; // ALGO considered "idle"
const ALGO_CONCENTRATION_THRESHOLD = 50; // % above which ALGO is "concentrated"
const DUE_SOON_DAYS = 3;

export class RecommendationService {
  static async getRecommendations(companyId: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      const [summary, pendingInvoices] = await Promise.all([
        AnalyticsService.getTreasurySummary(companyId),
        InvoiceRepository.findInbox(companyId, { direction: "received", status: "pending_approval" }),
      ]);

      // Rule 1: ALGO concentration
      const algoAsset = summary.assets.find((a: AssetAllocation) => a.assetId === 0);
      if (algoAsset && algoAsset.percentage > ALGO_CONCENTRATION_THRESHOLD) {
        recommendations.push({
          type: "warning",
          message: `Your treasury is ${algoAsset.percentage}% concentrated in ALGO. Consider diversifying into stable assets to reduce volatility risk.`,
        });
      }

      // Rule 2: Idle funds
      if (summary.algoBalance > IDLE_THRESHOLD_ALGO && summary.assets.length <= 1) {
        recommendations.push({
          type: "info",
          message: `You have ${summary.algoBalance.toFixed(2)} ALGO in idle funds. Consider deploying them into yield strategies or staking.`,
        });
      }

      // Rule 3: Invoices pending approval for a while (received)
      for (const invoice of pendingInvoices) {
        const created = new Date(invoice.created_at);
        const daysPending = Math.ceil((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPending >= DUE_SOON_DAYS) {
          recommendations.push({
            type: "warning",
            message: `Invoice from ${invoice.sender_company_name} (${invoice.amount} ${invoice.currency}) has been pending approval for ${daysPending} day(s).`,
          });
        }
      }

      // Rule 4: No invoices tracked
      if (pendingInvoices.length === 0 && summary.recentTransactions.length > 0) {
        recommendations.push({
          type: "info",
          message: "You have recent transactions but no tracked invoices. Start creating invoices to monitor your receivables.",
        });
      }

      // Rule 5: Healthy treasury
      if (recommendations.length === 0) {
        recommendations.push({
          type: "success",
          message: "Your treasury looks healthy. All invoices are on track and asset allocation is well-diversified.",
        });
      }
    } catch (err) {
      logger.error("Error generating recommendations:", err);
      recommendations.push({
        type: "info",
        message: "Unable to generate recommendations at this time. Please try again later.",
      });
    }

    return recommendations;
  }
}
