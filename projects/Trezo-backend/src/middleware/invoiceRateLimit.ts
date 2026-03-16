import { Request, Response, NextFunction } from "express";

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

// In-memory sliding window: companyId -> array of timestamps
const requestLog = new Map<number, number[]>();

export function invoiceRateLimit(req: Request, res: Response, next: NextFunction): void {
  const companyId = (req as any).companyId as number;
  if (!companyId) {
    next();
    return;
  }

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (requestLog.get(companyId) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS) {
    res.status(429).json({ success: false, error: "Rate limit exceeded: 20 invoices per minute" });
    return;
  }

  timestamps.push(now);
  requestLog.set(companyId, timestamps);
  next();
}
