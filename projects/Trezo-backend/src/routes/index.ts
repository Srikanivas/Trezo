import { Router } from "express";
import walletRoutes from "./walletRoutes";
import companyRoutes from "./companyRoutes";
import treasuryRoutes from "./treasuryRoutes";
import invoiceRoutes from "./invoiceRoutes";
import budgetRoutes from "./budgetRoutes";
import notificationRoutes from "./notificationRoutes";
import paymentRoutes from "./paymentRoutes";
import chatRoutes from "./chatRoutes";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Trezo Backend API is running",
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || "v1",
  });
});

// API routes
router.use("/wallet", walletRoutes);
router.use("/company", companyRoutes);
router.use("/companies", companyRoutes); // alias for /companies/search
router.use("/treasury", treasuryRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/budgets", budgetRoutes);
router.use("/notifications", notificationRoutes);
router.use("/payments", paymentRoutes);
router.use("/chat", chatRoutes);

export default router;
