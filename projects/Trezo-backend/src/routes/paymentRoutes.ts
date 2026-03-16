import { Router } from "express";
import { PaymentController } from "../controllers/paymentController";
import { authenticateToken } from "../middleware/auth";
import rateLimit from "express-rate-limit";

const router = Router();

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many payment requests, please try again later" },
});

router.use(authenticateToken);

router.post("/send", paymentLimiter, PaymentController.sendPayment);
router.get("/history", PaymentController.getHistory);

export default router;
