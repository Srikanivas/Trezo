import { CompanyRepository } from "../repositories/companyRepository";
import { TreasuryService } from "./treasuryService";
import { InvoiceService } from "./invoiceService";
import { BudgetService } from "./budgetService";
import { AnalyticsService } from "./analyticsService";
import { logger } from "../utils/logger";

// ─── Intent Types ─────────────────────────────────────────────────────────────

export type IntentType =
  | "SEND_ALGO"
  | "SEND_ASA"
  | "OPTIN_ASSET"
  | "CREATE_INVOICE"
  | "CREATE_BUDGET"
  | "CHECK_BALANCE"
  | "LIST_INVOICES"
  | "LIST_BUDGETS"
  | "HELP"
  | "UNKNOWN";

export interface ParsedIntent {
  intent: IntentType;
  params: Record<string, any>;
  confidence: "high" | "medium" | "low";
  missingFields: string[];
}

export interface ActionReport {
  intent: IntentType;
  summary: string;
  details: Record<string, any>;
  warnings: string[];
  errors: string[];
  requiresConfirmation: boolean;
}

export interface ExecuteResult {
  success: boolean;
  message: string;
  txId?: string;
  explorerUrl?: string;
  data?: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALGO_PATTERN = /(\d+(?:\.\d+)?)\s*(?:algo|algos|alg)\b/i;
const AMOUNT_PATTERN = /(\d+(?:\.\d+)?)\s*(algo|algos|alg|usdc|usdt|asa)?\b/i;
const ADDRESS_PATTERN = /\b([A-Z2-7]{58})\b/;
const ASSET_ID_PATTERN = /asset\s*(?:id\s*)?[:#]?\s*(\d+)/i;

function extractAmount(text: string): number | null {
  const m = ALGO_PATTERN.exec(text) ?? AMOUNT_PATTERN.exec(text);
  return m ? parseFloat(m[1]) : null;
}

function extractAddress(text: string): string | null {
  const m = ADDRESS_PATTERN.exec(text);
  return m ? m[1] : null;
}

function extractAssetId(text: string): number | null {
  const m = ASSET_ID_PATTERN.exec(text);
  if (m) return parseInt(m[1]);
  if (/usdc/i.test(text)) return 10458941;
  if (/usdt/i.test(text)) return 67395862;
  return null;
}

function extractCurrency(text: string): string {
  if (/usdc/i.test(text)) return "USDC";
  if (/usdt/i.test(text)) return "USDT";
  if (/algo/i.test(text)) return "ALGO";
  return "ALGO";
}

function extractPeriod(text: string): "monthly" | "quarterly" {
  return /quarter/i.test(text) ? "quarterly" : "monthly";
}

// ─── Intent Parser ────────────────────────────────────────────────────────────

export function parseIntent(text: string): ParsedIntent {
  const t = text.toLowerCase();

  // SEND
  if (/\b(send|transfer|pay|wire)\b/.test(t)) {
    const address = extractAddress(text);
    const amount = extractAmount(text);
    const assetId = extractAssetId(text);
    const currency = extractCurrency(text);
    const missing: string[] = [];
    if (!address) missing.push("receiver address");
    if (!amount) missing.push("amount");
    const intent: IntentType = assetId && assetId > 0 ? "SEND_ASA" : "SEND_ALGO";
    return {
      intent,
      params: { address, amount, assetId, currency },
      confidence: missing.length === 0 ? "high" : "medium",
      missingFields: missing,
    };
  }

  // OPT-IN
  if (/\b(opt.?in|optin|opt in|register asset|add asset|enable asset)\b/.test(t)) {
    const assetId = extractAssetId(text);
    const missing = assetId ? [] : ["asset ID"];
    return {
      intent: "OPTIN_ASSET",
      params: { assetId },
      confidence: assetId ? "high" : "medium",
      missingFields: missing,
    };
  }

  // CREATE INVOICE
  if (
    /\b(create|send|make|issue|generate)\b.{0,30}\b(invoice|bill)\b/.test(t) ||
    /\b(invoice|bill)\b.{0,30}\b(create|send|make|issue|generate)\b/.test(t)
  ) {
    const amount = extractAmount(text);
    const currency = extractCurrency(text);
    // Extract company name — text after "to" or "for"
    const toMatch = /\bto\s+([A-Za-z0-9 &._-]{2,40}?)(?:\s+for|\s+amount|\s+of|\s*$)/i.exec(text);
    const companyName = toMatch ? toMatch[1].trim() : null;
    const msgMatch = /\bfor\s+(.{3,100}?)(?:\s+amount|\s+of|\s*$)/i.exec(text);
    const message = msgMatch ? msgMatch[1].trim() : null;
    const missing: string[] = [];
    if (!companyName) missing.push("recipient company name");
    if (!amount) missing.push("amount");
    return {
      intent: "CREATE_INVOICE",
      params: { companyName, amount, currency, message },
      confidence: missing.length === 0 ? "high" : "medium",
      missingFields: missing,
    };
  }

  // CREATE BUDGET
  if (/\b(create|set|add|make)\b.{0,20}\b(budget|limit|cap)\b/.test(t)) {
    const amount = extractAmount(text);
    const currency = extractCurrency(text);
    const period = extractPeriod(text);
    const nameMatch = /\b(?:budget|limit)\s+(?:for\s+)?([A-Za-z0-9 &._-]{2,40}?)(?:\s+of|\s+amount|\s*$)/i.exec(text);
    const name = nameMatch ? nameMatch[1].trim() : `${currency} ${period} budget`;
    const missing = amount ? [] : ["limit amount"];
    return {
      intent: "CREATE_BUDGET",
      params: { name, amount, currency, period },
      confidence: missing.length === 0 ? "high" : "medium",
      missingFields: missing,
    };
  }

  // CHECK BALANCE
  if (/\b(balance|wallet|funds|holdings|assets)\b/.test(t)) {
    return { intent: "CHECK_BALANCE", params: {}, confidence: "high", missingFields: [] };
  }

  // LIST INVOICES
  if (/\b(invoices?|bills?|payables?|receivables?)\b/.test(t) && /\b(list|show|get|view|my|all)\b/.test(t)) {
    return { intent: "LIST_INVOICES", params: {}, confidence: "high", missingFields: [] };
  }

  // LIST BUDGETS
  if (/\b(budgets?|limits?|caps?)\b/.test(t) && /\b(list|show|get|view|my|all)\b/.test(t)) {
    return { intent: "LIST_BUDGETS", params: {}, confidence: "high", missingFields: [] };
  }

  // HELP
  if (/\b(help|what can|commands?|how to|guide)\b/.test(t)) {
    return { intent: "HELP", params: {}, confidence: "high", missingFields: [] };
  }

  return { intent: "UNKNOWN", params: {}, confidence: "low", missingFields: [] };
}

// ─── Report Builder ───────────────────────────────────────────────────────────

export async function buildReport(parsed: ParsedIntent, companyId: number): Promise<ActionReport> {
  const warnings: string[] = [];
  const errors: string[] = [];

  switch (parsed.intent) {
    case "SEND_ALGO": {
      const { address, amount } = parsed.params;
      if (!address) errors.push("Receiver address is required.");
      else if (!TreasuryService.validateAddress(address)) errors.push(`"${address}" is not a valid Algorand address.`);
      if (!amount || amount <= 0) errors.push("Amount must be greater than zero.");
      if (amount > 1000) warnings.push(`Sending ${amount} ALGO is a large transaction. Please verify.`);
      return {
        intent: "SEND_ALGO",
        summary: `Send ${amount ?? "?"} ALGO to ${address ?? "?"}`,
        details: { to: address, amount, asset: "ALGO", fee: "~0.001 ALGO" },
        warnings,
        errors,
        requiresConfirmation: errors.length === 0,
      };
    }

    case "SEND_ASA": {
      const { address, amount, assetId, currency } = parsed.params;
      if (!address) errors.push("Receiver address is required.");
      else if (!TreasuryService.validateAddress(address)) errors.push(`"${address}" is not a valid Algorand address.`);
      if (!amount || amount <= 0) errors.push("Amount must be greater than zero.");
      if (!assetId) errors.push("Asset ID is required for ASA transfers.");
      return {
        intent: "SEND_ASA",
        summary: `Send ${amount ?? "?"} ${currency} (ASA #${assetId ?? "?"}) to ${address ?? "?"}`,
        details: { to: address, amount, assetId, asset: currency, fee: "~0.001 ALGO" },
        warnings,
        errors,
        requiresConfirmation: errors.length === 0,
      };
    }

    case "OPTIN_ASSET": {
      const { assetId } = parsed.params;
      if (!assetId) errors.push("Asset ID is required.");
      else {
        try {
          const info = await TreasuryService.getAssetInfo(assetId);
          return {
            intent: "OPTIN_ASSET",
            summary: `Opt-in to ${info.name ?? `ASA #${assetId}`} (${info.unitName})`,
            details: {
              assetId,
              name: info.name,
              unitName: info.unitName,
              decimals: info.decimals,
              fee: "~0.001 ALGO + 0.1 ALGO min balance",
            },
            warnings: ["This will lock 0.1 ALGO as minimum balance for this asset."],
            errors: [],
            requiresConfirmation: true,
          };
        } catch {
          errors.push(`Asset #${assetId} not found on Algorand TestNet.`);
        }
      }
      return {
        intent: "OPTIN_ASSET",
        summary: `Opt-in to asset #${assetId ?? "?"}`,
        details: {},
        warnings,
        errors,
        requiresConfirmation: false,
      };
    }

    case "CREATE_INVOICE": {
      const { companyName, amount, currency, message } = parsed.params;
      if (!companyName) {
        errors.push("Recipient company name is required.");
      } else {
        const results = await CompanyRepository.searchByName(companyName, companyId);
        if (results.length === 0) {
          errors.push(`No company found matching "${companyName}". Only registered Trezo companies can receive invoices.`);
        } else if (results.length > 1) {
          warnings.push(
            `Multiple companies match "${companyName}": ${results.map((c) => c.company_name).join(", ")}. Using the first match.`,
          );
          parsed.params.receiverCompanyId = results[0].id;
          parsed.params.receiverCompanyName = results[0].company_name;
        } else {
          parsed.params.receiverCompanyId = results[0].id;
          parsed.params.receiverCompanyName = results[0].company_name;
        }
      }
      if (!amount || amount <= 0) errors.push("Invoice amount must be greater than zero.");
      return {
        intent: "CREATE_INVOICE",
        summary: `Create invoice for ${amount ?? "?"} ${currency} to ${parsed.params.receiverCompanyName ?? companyName ?? "?"}`,
        details: {
          to: parsed.params.receiverCompanyName ?? companyName,
          receiverCompanyId: parsed.params.receiverCompanyId,
          amount,
          currency,
          message: message ?? "Invoice",
          status: "pending_approval",
        },
        warnings,
        errors,
        requiresConfirmation: errors.length === 0,
      };
    }

    case "CREATE_BUDGET": {
      const { name, amount, currency, period } = parsed.params;
      if (!amount || amount <= 0) errors.push("Budget limit must be greater than zero.");
      return {
        intent: "CREATE_BUDGET",
        summary: `Create ${period} budget "${name}" — ${amount ?? "?"} ${currency} limit`,
        details: { name, limitAmount: amount, currency, period },
        warnings,
        errors,
        requiresConfirmation: errors.length === 0,
      };
    }

    default:
      return { intent: parsed.intent, summary: "", details: {}, warnings, errors, requiresConfirmation: false };
  }
}

// ─── Executor ─────────────────────────────────────────────────────────────────

export async function executeAction(report: ActionReport, companyId: number): Promise<ExecuteResult> {
  const { getTransactionUrl } = await import("../config/explorer");

  try {
    switch (report.intent) {
      case "SEND_ALGO": {
        const { to, amount } = report.details;
        const txId = await TreasuryService.sendTransaction({ companyId, receiverAddress: to, amount, note: "TREZO_CHAT" });
        return { success: true, message: `✅ Sent ${amount} ALGO successfully.`, txId, explorerUrl: getTransactionUrl(txId) };
      }

      case "SEND_ASA": {
        const { to, amount, assetId } = report.details;
        const txId = await TreasuryService.sendTransaction({ companyId, receiverAddress: to, amount, assetId, note: "TREZO_CHAT" });
        return {
          success: true,
          message: `✅ Sent ${amount} ${report.details.asset} successfully.`,
          txId,
          explorerUrl: getTransactionUrl(txId),
        };
      }

      case "OPTIN_ASSET": {
        const { assetId } = report.details;
        const txId = await TreasuryService.optInAsset(companyId, assetId);
        return {
          success: true,
          message: `✅ Opted in to ${report.details.name ?? `ASA #${assetId}`} successfully.`,
          txId,
          explorerUrl: getTransactionUrl(txId),
        };
      }

      case "CREATE_INVOICE": {
        const { receiverCompanyId, amount, currency, message } = report.details;
        const invoice = await InvoiceService.createInvoice({
          senderCompanyId: companyId,
          receiverCompanyId,
          amount: String(amount),
          currency,
          message: message ?? "Invoice via AI CFO",
        });
        return {
          success: true,
          message: `✅ Invoice #${invoice.id} created and sent to ${invoice.receiver_company_name}.`,
          data: { invoiceId: invoice.id },
        };
      }

      case "CREATE_BUDGET": {
        const { name, limitAmount, currency, period } = report.details;
        const budget = await BudgetService.createBudget(companyId, {
          name,
          currency,
          asset_id: null,
          limit_amount: String(limitAmount),
          period,
        });
        return {
          success: true,
          message: `✅ Budget "${budget.name}" created with ${limitAmount} ${currency} ${period} limit.`,
          data: { budgetId: budget.id },
        };
      }

      default:
        return { success: false, message: "Unknown action." };
    }
  } catch (err: any) {
    logger.error("Chat execute error:", err);
    return { success: false, message: `❌ ${err.message ?? "Execution failed."}` };
  }
}

// ─── Read-only queries ────────────────────────────────────────────────────────

export async function handleReadQuery(intent: IntentType, companyId: number): Promise<string> {
  if (intent === "CHECK_BALANCE") {
    const company = await CompanyRepository.findById(companyId);
    if (!company) return "Company not found.";
    const balance = await TreasuryService.getWalletBalance(company.wallet_address, companyId);
    const assetLines = balance.assets.map((a) => `  • ${a.unitName ?? `ASA-${a.assetId}`}: ${a.amount.toFixed(4)}`).join("\n");
    return `**Treasury Balance**\n• ALGO: ${balance.algoBalance.toFixed(4)}\n${assetLines || "  (no other assets)"}`;
  }

  if (intent === "LIST_INVOICES") {
    const { InvoiceRepository } = await import("../repositories/invoiceRepository");
    const invoices = await InvoiceRepository.findInbox(companyId, { limit: 5 });
    if (!invoices.length) return "No invoices found.";
    return (
      "**Recent Invoices**\n" +
      invoices
        .map(
          (i) =>
            `  • #${i.id} — ${i.amount} ${i.currency} — ${i.status} (${i.sender_company_id === companyId ? "sent to " + i.receiver_company_name : "from " + i.sender_company_name})`,
        )
        .join("\n")
    );
  }

  if (intent === "LIST_BUDGETS") {
    const budgets = await BudgetService.listBudgets(companyId);
    if (!budgets.length) return "No budgets found.";
    return (
      "**Budgets**\n" + budgets.map((b) => `  • ${b.name}: ${b.consumed_amount}/${b.limit_amount} ${b.currency} (${b.period})`).join("\n")
    );
  }

  if (intent === "HELP") {
    return `**AI CFO — What I can do:**\n• Send ALGO: _"Send 5 ALGO to ADDR..."_\n• Send ASA: _"Send 10 USDC to ADDR..."_\n• Opt-in: _"Opt in to USDC"_ or _"Opt in to asset 10458941"_\n• Create invoice: _"Create invoice for 100 ALGO to CompanyName for services"_\n• Create budget: _"Create monthly budget of 500 ALGO"_\n• Check balance: _"Show my balance"_\n• List invoices: _"Show my invoices"_\n• List budgets: _"Show my budgets"_`;
  }

  return "";
}
