import { Request, Response } from "express";
import { AnalyticsService } from "../services/analyticsService";
import { RecommendationService } from "../services/recommendationService";
import { AIRecommendationService } from "../services/aiRecommendationService";
import { logger } from "../utils/logger";

export class AnalyticsController {
  /**
   * GET /api/v1/treasury/summary
   */
  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const summary = await AnalyticsService.getTreasurySummary(companyId);
      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      logger.error("Error getting treasury summary:", error);
      res.status(500).json({ success: false, error: "Failed to retrieve treasury summary" });
    }
  }

  /**
   * GET /api/v1/treasury/analytics
   */
  static async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const analytics = await AnalyticsService.getAnalytics(companyId);
      res.status(200).json({ success: true, data: analytics });
    } catch (error) {
      logger.error("Error getting treasury analytics:", error);
      res.status(500).json({ success: false, error: "Failed to retrieve analytics" });
    }
  }

  /**
   * GET /api/v1/treasury/recommendations
   * Legacy simple recommendations (kept for backward compat)
   */
  static async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const recommendations = await RecommendationService.getRecommendations(companyId);
      res.status(200).json({ success: true, data: recommendations });
    } catch (error) {
      logger.error("Error getting recommendations:", error);
      res.status(500).json({ success: false, error: "Failed to retrieve recommendations" });
    }
  }

  /**
   * GET /api/v1/treasury/ai-recommendations
   * Full AI CFO recommendations with market data
   */
  static async getAIRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const recommendations = await AIRecommendationService.getRecommendations(companyId);
      res.status(200).json({ success: true, data: recommendations });
    } catch (error) {
      logger.error("Error getting AI recommendations:", error);
      res.status(500).json({ success: false, error: "Failed to retrieve AI recommendations" });
    }
  }

  /**
   * GET /api/v1/treasury/ai-data
   * Aggregated treasury data for AI analysis
   */
  static async getAIData(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const data = await AIRecommendationService.getAITreasuryData(companyId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      logger.error("Error getting AI treasury data:", error);
      res.status(500).json({ success: false, error: "Failed to retrieve AI treasury data" });
    }
  }
}
