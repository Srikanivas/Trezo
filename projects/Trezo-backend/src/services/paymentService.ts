import { PaymentRepository, CreatePaymentData } from "../repositories/paymentRepository";
import { AuditLogRepository } from "../repositories/auditLogRepository";
import { TreasuryService } from "./treasuryService";
import { WalletKeyRepository } from "../repositories/walletKeyRepository";
import { CompanyRepository } from "../repositories/companyRepository";
import { logger } from "../utils/logger";

export interface SendPaymentRequest {
  companyId: number;
  receiverAddress: string;
  amount: number;
  assetType: string;
  assetId?: number | null;
  description?: string;
}

export class PaymentService {
  static async sendPayment(req: SendPaymentRequest) {
    if (!req.receiverAddress || !req.amount || !req.assetType) {
      throw Object.assign(new Error("receiver_address, amount, and asset_type are required"), { status: 400 });
    }
    if (req.amount <= 0) {
      throw Object.assign(new Error("Amount must be greater than zero"), { status: 400 });
    }
    if (!TreasuryService.validateAddress(req.receiverAddress)) {
      throw Object.assign(new Error("Invalid Algorand receiver address"), { status: 400 });
    }

    const walletKey = await WalletKeyRepository.findByCompanyId(req.companyId);
    if (!walletKey) {
      throw Object.assign(new Error("Treasury wallet not found for this company"), { status: 404 });
    }

    const company = await CompanyRepository.findById(req.companyId);

    // Create payment record in pending state
    const createData: CreatePaymentData = {
      company_id: req.companyId,
      receiver_address: req.receiverAddress,
      amount: String(req.amount),
      asset_type: req.assetType,
      asset_id: req.assetId ?? null,
      description: req.description ?? null,
    };
    const payment = await PaymentRepository.create(createData);

    let txHash: string;
    try {
      txHash = await TreasuryService.sendTransaction({
        companyId: req.companyId,
        receiverAddress: req.receiverAddress,
        amount: req.amount,
        assetId: req.assetId ?? undefined,
        note: req.description ? `TREZO_PAYMENT: ${req.description}` : "TREZO_PAYMENT",
      });
    } catch (err) {
      await PaymentRepository.updateStatus(payment.id, "failed");
      logger.error(`Payment ${payment.id} failed:`, err);
      throw Object.assign(new Error("Blockchain transaction failed"), { status: 502 });
    }

    const confirmed = await PaymentRepository.updateStatus(payment.id, "confirmed", txHash);

    // Audit log
    await AuditLogRepository.create({
      company_id: req.companyId,
      operation_type: "TREASURY_PAYMENT",
      wallet_address: company?.wallet_address ?? "",
      transaction_id: txHash,
      amount: Math.round(req.amount * 1_000_000),
      recipient_address: req.receiverAddress,
      details: {
        asset: req.assetType,
        description: req.description,
        payment_id: payment.id,
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(`Payment ${payment.id} confirmed, txHash=${txHash}`);
    return confirmed!;
  }

  static async getHistory(companyId: number, limit = 20, offset = 0) {
    return PaymentRepository.findByCompanyId(companyId, limit, offset);
  }
}
