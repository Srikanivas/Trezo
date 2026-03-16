import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { logger } from "../utils/logger";

// Validation schemas
const recoverWalletSchema = Joi.object({
  mnemonic: Joi.string()
    .required()
    .trim()
    .pattern(/^(\w+\s){24}\w+$/)
    .message("Mnemonic must contain exactly 25 words separated by spaces"),
});

const validateMnemonicSchema = Joi.object({
  mnemonic: Joi.string().required().trim().min(1).message("Mnemonic is required"),
});

/**
 * Middleware to validate recover wallet request
 */
export const validateRecoverWalletRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = recoverWalletSchema.validate(req.body);

  if (error) {
    logger.warn("Validation error in recover wallet request:", error.details[0].message);
    res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
    return;
  }

  next();
};

/**
 * Middleware to validate mnemonic validation request
 */
export const validateMnemonicRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error } = validateMnemonicSchema.validate(req.body);

  if (error) {
    logger.warn("Validation error in validate mnemonic request:", error.details[0].message);
    res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
    return;
  }

  next();
};

/**
 * Generic validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);

    if (error) {
      logger.warn("Validation error:", error.details[0].message);
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }

    next();
  };
};
// New validation schemas for treasury system
const registerCompanySchema = Joi.object({
  companyName: Joi.string().required().trim().min(2).max(100).messages({
    "string.empty": "Company name is required",
    "string.min": "Company name must be at least 2 characters",
    "string.max": "Company name must not exceed 100 characters",
    "any.required": "Company name is required",
  }),
  email: Joi.string().email().required().lowercase().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

const sendTransactionSchema = Joi.object({
  receiverAddress: Joi.string().required().length(58).messages({
    "string.empty": "Receiver address is required",
    "string.length": "Invalid Algorand address format",
    "any.required": "Receiver address is required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  assetId: Joi.number().integer().min(0).optional().messages({
    "number.integer": "Asset ID must be an integer",
    "number.min": "Asset ID must be non-negative",
  }),
  note: Joi.string().max(1000).optional().messages({
    "string.max": "Note must not exceed 1000 characters",
  }),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
    "any.required": "Current password is required",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "New password must be at least 8 characters long",
    "string.empty": "New password is required",
    "any.required": "New password is required",
  }),
});

// New validation middleware
export const validateRegisterCompany = validate(registerCompanySchema);
export const validateLogin = validate(loginSchema);
export const validateSendTransaction = validate(sendTransactionSchema);
export const validateUpdatePassword = validate(updatePasswordSchema);

// Parameter validation middleware
export const validateCompanyIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const companyId = parseInt(req.params.companyId);

  if (isNaN(companyId) || companyId <= 0) {
    res.status(400).json({
      success: false,
      error: "Invalid company ID",
    });
    return;
  }

  next();
};

export const validateAssetIdParam = (req: Request, res: Response, next: NextFunction): void => {
  const assetId = parseInt(req.params.assetId);

  if (isNaN(assetId) || assetId <= 0) {
    res.status(400).json({
      success: false,
      error: "Invalid asset ID",
    });
    return;
  }

  next();
};
