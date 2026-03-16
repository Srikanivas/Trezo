import { Router } from "express";
import { WalletController } from "../controllers/walletController";
import { validateRecoverWalletRequest, validateMnemonicRequest } from "../middleware/validation";

const router = Router();

/**
 * @route   POST /api/v1/wallet/create
 * @desc    Create a new Algorand wallet
 * @access  Public
 */
router.post("/create", WalletController.createWallet);

/**
 * @route   POST /api/v1/wallet/recover
 * @desc    Recover wallet from mnemonic phrase
 * @access  Public
 */
router.post("/recover", validateRecoverWalletRequest, WalletController.recoverWallet);

/**
 * @route   POST /api/v1/wallet/validate
 * @desc    Validate a mnemonic phrase
 * @access  Public
 */
router.post("/validate", validateMnemonicRequest, WalletController.validateMnemonic);

/**
 * @route   GET /api/v1/wallet/account/:address
 * @desc    Get account information for an address
 * @access  Public
 */
router.get("/account/:address", WalletController.getAccountInfo);

export default router;
