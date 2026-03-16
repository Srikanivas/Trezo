import { BudgetRepository, Budget, CreateBudgetData, BudgetCheckResult } from "../repositories/budgetRepository";
import { NotificationService } from "./notificationService";

function getPeriodStart(period: "monthly" | "quarterly"): Date {
  const now = new Date();
  if (period === "monthly") return new Date(now.getFullYear(), now.getMonth(), 1);
  const quarter = Math.floor(now.getMonth() / 3);
  return new Date(now.getFullYear(), quarter * 3, 1);
}

function isNewPeriod(budget: Budget): boolean {
  const currentStart = getPeriodStart(budget.period);
  const storedStart = new Date(budget.period_start);
  return currentStart > storedStart;
}

export class BudgetService {
  static async createBudget(companyId: number, data: Omit<CreateBudgetData, "company_id" | "period_start">): Promise<Budget> {
    const periodStart = getPeriodStart(data.period).toISOString().split("T")[0];
    return BudgetRepository.create({ ...data, company_id: companyId, period_start: periodStart });
  }

  static async listBudgets(companyId: number): Promise<Budget[]> {
    return BudgetRepository.findByCompany(companyId);
  }

  static async getBudget(id: number, companyId: number): Promise<Budget | null> {
    return BudgetRepository.findById(id, companyId);
  }

  static async updateBudget(id: number, companyId: number, data: Partial<CreateBudgetData>): Promise<Budget | null> {
    return BudgetRepository.update(id, companyId, data);
  }

  static async deleteBudget(id: number, companyId: number): Promise<boolean> {
    return BudgetRepository.delete(id, companyId);
  }

  static async checkBudget(companyId: number, amount: string, currency: string, assetId?: number | null): Promise<BudgetCheckResult> {
    const budget = await BudgetRepository.findActiveForCurrency(companyId, currency, assetId);
    if (!budget) {
      return { budgetId: null, exceeded: false, currentConsumed: "0", limit: "0", overage: "0" };
    }

    // Lazy period reset
    let consumed = parseFloat(budget.consumed_amount);
    if (isNewPeriod(budget)) {
      consumed = 0;
    }

    const limit = parseFloat(budget.limit_amount);
    const payment = parseFloat(amount);
    const newTotal = consumed + payment;
    const exceeded = newTotal > limit;
    const overage = exceeded ? (newTotal - limit).toFixed(6) : "0";

    return {
      budgetId: budget.id,
      exceeded,
      currentConsumed: consumed.toFixed(6),
      limit: budget.limit_amount,
      overage,
    };
  }

  static async recordPayment(companyId: number, amount: string, currency: string, assetId?: number | null): Promise<void> {
    const budget = await BudgetRepository.findActiveForCurrency(companyId, currency, assetId);
    if (!budget) return;

    const payment = parseFloat(amount);
    const limit = parseFloat(budget.limit_amount);

    let previousConsumed = parseFloat(budget.consumed_amount);
    let newPeriodStart: string | undefined;

    // Lazy reset if new period
    if (isNewPeriod(budget)) {
      previousConsumed = 0;
      newPeriodStart = getPeriodStart(budget.period).toISOString().split("T")[0];
    }

    const newConsumed = previousConsumed + payment;
    await BudgetRepository.updateConsumed(budget.id, newConsumed.toFixed(6), newPeriodStart);

    // 80% threshold notification
    if (newConsumed / limit >= 0.8 && previousConsumed / limit < 0.8) {
      await NotificationService.deliver(companyId, "BUDGET_80_PERCENT", {
        budgetId: budget.id,
        currency,
        period: budget.period,
      });
    }
  }
}
