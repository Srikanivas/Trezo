import { Request, Response } from "express";
import { BudgetService } from "../services/budgetService";
import { logger } from "../utils/logger";

export class BudgetController {
  static async createBudget(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const { name, currency, asset_id, limit_amount, period } = req.body;
      if (!name || !currency || !limit_amount || !period) {
        res.status(400).json({ success: false, error: "name, currency, limit_amount, and period are required" });
        return;
      }
      const budget = await BudgetService.createBudget(companyId, { name, currency, asset_id, limit_amount, period });
      res.status(201).json({ success: true, data: budget });
    } catch (err) {
      logger.error("createBudget error:", err);
      res.status(500).json({ success: false, error: "Failed to create budget" });
    }
  }

  static async listBudgets(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const budgets = await BudgetService.listBudgets(companyId);
      res.status(200).json({ success: true, data: budgets });
    } catch (err) {
      logger.error("listBudgets error:", err);
      res.status(500).json({ success: false, error: "Failed to list budgets" });
    }
  }

  static async getBudget(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const budget = await BudgetService.getBudget(id, companyId);
      if (!budget) {
        res.status(404).json({ success: false, error: "Budget not found" });
        return;
      }
      res.status(200).json({ success: true, data: budget });
    } catch (err) {
      logger.error("getBudget error:", err);
      res.status(500).json({ success: false, error: "Failed to get budget" });
    }
  }

  static async updateBudget(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const budget = await BudgetService.updateBudget(id, companyId, req.body);
      if (!budget) {
        res.status(404).json({ success: false, error: "Budget not found" });
        return;
      }
      res.status(200).json({ success: true, data: budget });
    } catch (err) {
      logger.error("updateBudget error:", err);
      res.status(500).json({ success: false, error: "Failed to update budget" });
    }
  }

  static async deleteBudget(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).companyId;
      const id = parseInt(req.params.id);
      const deleted = await BudgetService.deleteBudget(id, companyId);
      if (!deleted) {
        res.status(404).json({ success: false, error: "Budget not found" });
        return;
      }
      res.status(200).json({ success: true, message: "Budget deleted" });
    } catch (err) {
      logger.error("deleteBudget error:", err);
      res.status(500).json({ success: false, error: "Failed to delete budget" });
    }
  }
}
