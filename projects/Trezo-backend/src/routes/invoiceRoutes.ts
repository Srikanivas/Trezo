import { Router, Request, Response, NextFunction } from "express";
import { InvoiceController } from "../controllers/invoiceController";
import { authenticateToken } from "../middleware/auth";
import { uploadReceipt } from "../middleware/upload";
import { invoiceRateLimit } from "../middleware/invoiceRateLimit";

const router = Router();

// Multer error handler wrapper
function withUpload(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadReceipt(req, res, (err) => {
      if (err) {
        const msg =
          err.message.includes("File size") || err.message.includes("LIMIT_FILE_SIZE") ? "File size must not exceed 10 MB" : err.message;
        res.status(400).json({ success: false, error: msg });
        return;
      }
      handler(req, res).catch(next);
    });
  };
}

// NOTE: /inbox and /summary must come before /:id to avoid route shadowing
router.get("/inbox", authenticateToken, InvoiceController.getInbox);
router.get("/summary", authenticateToken, InvoiceController.getSummary);
router.get("/stats", authenticateToken, InvoiceController.getStats);

router.post("/", authenticateToken, invoiceRateLimit, withUpload(InvoiceController.createInvoice));
router.get("/:id", authenticateToken, InvoiceController.getInvoice);
router.get("/:id/receipt", authenticateToken, InvoiceController.getReceipt);
router.post("/:id/approve", authenticateToken, InvoiceController.approveInvoice);
router.post("/:id/reject", authenticateToken, InvoiceController.rejectInvoice);
router.post("/:id/cancel", authenticateToken, InvoiceController.cancelInvoice);
router.post("/:id/pay", authenticateToken, InvoiceController.payInvoice);

export default router;
