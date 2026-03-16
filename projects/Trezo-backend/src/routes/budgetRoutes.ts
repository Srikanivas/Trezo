import { Router } from "express";
import { BudgetController } from "../controllers/budgetController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/", authenticateToken, BudgetController.createBudget);
router.get("/", authenticateToken, BudgetController.listBudgets);
router.get("/:id", authenticateToken, BudgetController.getBudget);
router.put("/:id", authenticateToken, BudgetController.updateBudget);
router.delete("/:id", authenticateToken, BudgetController.deleteBudget);

export default router;
