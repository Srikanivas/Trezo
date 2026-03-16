import { Request, Response, NextFunction } from "express";
import { CompanyService } from "../services/companyService";
import { logger } from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  companyId: number;
  email: string;
}

/**
 * JWT Authentication middleware
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Access token required",
      });
      return;
    }

    const decoded = CompanyService.verifyToken(token);
    if (!decoded) {
      res.status(403).json({
        success: false,
        error: "Invalid or expired token",
      });
      return;
    }

    // Add company info to request object
    (req as any).companyId = decoded.companyId;
    (req as any).email = decoded.email;

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(403).json({
      success: false,
      error: "Invalid token",
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = CompanyService.verifyToken(token);
      if (decoded) {
        (req as any).companyId = decoded.companyId;
        (req as any).email = decoded.email;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
