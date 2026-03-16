import { Router } from "express";
import { TreasuryController } from "../controllers/treasuryController";
import { AnalyticsController } from "../controllers/analyticsController";
import { authenticateToken } from "../middleware/auth";
import { validateSendTransaction, validateCompanyIdParam, validateAssetIdParam } from "../middleware/validation";

const router = Router();

/**
 * @route   GET /api/v1/treasury/balance/:companyId
 * @desc    Get treasury wallet balance and assets
 * @access  Private
 */
router.get("/balance/:companyId", authenticateToken, validateCompanyIdParam, TreasuryController.getBalance);

/**
 * @route   GET /api/v1/treasury/transactions/:companyId
 * @desc    Get treasury transaction history
 * @access  Private
 */
router.get("/transactions/:companyId", authenticateToken, validateCompanyIdParam, TreasuryController.getTransactions);

/**
 * @route   POST /api/v1/treasury/optin
 * @desc    Opt-in treasury wallet to an ASA
 * @access  Private
 */
router.post("/optin", authenticateToken, TreasuryController.optInAsset);

/**
 * @route   POST /api/v1/treasury/send
 * @desc    Send transaction from treasury wallet
 * @access  Private
 */
router.post("/send", authenticateToken, validateSendTransaction, TreasuryController.sendTransaction);

/**
 * @route   GET /api/v1/treasury/audit/:companyId
 * @desc    Get audit log for treasury operations
 * @access  Private
 */
router.get("/audit/:companyId", authenticateToken, validateCompanyIdParam, TreasuryController.getAuditLog);

/**
 * @route   GET /api/v1/treasury/asset/:assetId
 * @desc    Get asset information
 * @access  Private
 */
router.get("/asset/:assetId", authenticateToken, validateAssetIdParam, TreasuryController.getAssetInfo);

/**
 * @route   GET /api/v1/treasury/summary
 * @desc    Get full treasury summary with asset allocation
 * @access  Private
 */
router.get("/summary", authenticateToken, AnalyticsController.getSummary);

/**
 * @route   GET /api/v1/treasury/analytics
 * @desc    Get treasury analytics metrics
 * @access  Private
 */
router.get("/analytics", authenticateToken, AnalyticsController.getAnalytics);

/**
 * @route   GET /api/v1/treasury/recommendations
 * @desc    Get AI-based financial recommendations
 * @access  Private
 */
router.get("/recommendations", authenticateToken, AnalyticsController.getRecommendations);

/**
 * @route   GET /api/v1/treasury/ai-recommendations
 * @desc    Get full AI CFO recommendations with market data
 * @access  Private
 */
router.get("/ai-recommendations", authenticateToken, AnalyticsController.getAIRecommendations);

/**
 * @route   GET /api/v1/treasury/ai-data
 * @desc    Get aggregated treasury data for AI analysis
 * @access  Private
 */
router.get("/ai-data", authenticateToken, AnalyticsController.getAIData);

export default router;
