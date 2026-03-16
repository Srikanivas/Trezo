import axios, { AxiosInstance, AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("trezo_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      sessionStorage.removeItem("trezo_token");
      sessionStorage.removeItem("trezo_company");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Company {
  id: number;
  companyName: string;
  email: string;
  walletAddress: string;
}

export interface AuthResponse {
  success: boolean;
  data?: { token: string; company: Company };
  error?: string;
}

export interface TreasuryBalance {
  address: string;
  algoBalance: number;
  assets: AssetHolding[];
  totalValueUSD?: number;
}

export interface AssetHolding {
  assetId: number;
  amount: number;
  decimals: number;
  name?: string;
  unitName?: string;
  url?: string;
}

export interface AlgorandTransaction {
  id: string;
  sender: string;
  receiver?: string;
  amount: number;
  assetId?: number;
  type: string;
  timestamp: number;
  fee: number;
  note?: string;
}

export interface TransactionHistory {
  transactions: AlgorandTransaction[];
  nextToken?: string;
}

export interface SendTransactionRequest {
  receiverAddress: string;
  amount: number;
  assetId?: number;
  note?: string;
}

export interface AuditLogEntry {
  id: number;
  company_id: number;
  operation_type: string;
  wallet_address: string;
  transaction_id?: string;
  amount?: number;
  asset_id?: number;
  recipient_address?: string;
  details?: any;
  created_at: string;
}

export interface AssetAllocation {
  name: string;
  unitName: string;
  assetId: number;
  balance: number;
  percentage: number;
  decimals: number;
}

export interface TreasurySummary {
  totalTreasuryValue: number;
  algoBalance: number;
  assets: AssetAllocation[];
  recentTransactions: any[];
  pendingInvoicesValue: number;
}

export interface TreasuryAnalytics {
  treasuryValue: number;
  pendingInvoices: number;
  monthlyRevenue: number;
  monthlyPayments: number;
  largestTransactionThisMonth: number;
}

export interface Recommendation {
  type: "warning" | "info" | "success";
  message: string;
}

// ─── Smart Invoice Types ──────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "pending_approval" | "approved" | "rejected" | "paid" | "cancelled";
export type VerificationStatus = "not_applicable" | "matched" | "mismatch" | "unverifiable" | "timeout" | "pending";

export interface BillSummary {
  vendorName: string | null;
  lineItems: Array<{ description: string; amount: string }>;
  subtotal: string | null;
  tax: string | null;
  total: string | null;
  extractedAt: string;
}

export interface Invoice {
  id: number;
  sender_company_id: number;
  receiver_company_id: number;
  amount: string;
  currency: string;
  asset_id: number | null;
  message: string;
  status: InvoiceStatus;
  autopay_enabled: boolean;
  autopay_failed: boolean;
  rejection_reason: string | null;
  transaction_id: string | null;
  receipt_image_id: number | null;
  bill_summary: BillSummary | null;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
  sender_company_name: string;
  receiver_company_name: string;
}

export interface InvoiceSummary {
  total_payables: string;
  total_receivables: string;
  paid_this_month: string;
  pending_approval_count: number;
}

export interface Budget {
  id: number;
  company_id: number;
  name: string;
  currency: string;
  asset_id: number | null;
  limit_amount: string;
  period: "monthly" | "quarterly";
  consumed_amount: string;
  period_start: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  company_id: number;
  type: string;
  title: string;
  body: string;
  invoice_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface CompanySearchResult {
  id: number;
  company_name: string;
  wallet_address: string;
}

export interface InvoiceInboxFilters {
  status?: InvoiceStatus;
  direction?: "sent" | "received";
  currency?: string;
  page?: number;
  limit?: number;
}

// ─── AI CFO Types ─────────────────────────────────────────────────────────────

export type AIRecommendationType =
  | "LIQUIDITY"
  | "CONCENTRATION"
  | "IDLE_CAPITAL"
  | "INVOICE_REMINDER"
  | "LARGE_TX_ALERT"
  | "MARKET_VOLATILITY"
  | "DIVERSIFICATION"
  | "HEALTHY";

export interface AIRecommendation {
  type: AIRecommendationType;
  severity: "warning" | "info" | "success";
  message: string;
  recommendation: string;
}

export interface MarketPrice {
  symbol: string;
  usdPrice: number;
  change24h: number | null;
}

export interface AITreasuryData {
  totalTreasuryValue: number;
  totalTreasuryValueUSD: number;
  assets: AssetAllocation[];
  pendingInvoices: Array<{ id: number; amount: string; currency: string; senderName: string; createdAt: string }>;
  scheduledPayments: Array<{ id: number; amount: string; asset_type: string; receiver_address: string; created_at: string }>;
  recentTransactions: any[];
  marketPrices: MarketPrice[];
}

// ─── Payment Types ────────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "confirmed" | "failed";

export interface Payment {
  id: number;
  company_id: number;
  receiver_address: string;
  amount: string;
  asset_type: string;
  asset_id: number | null;
  description: string | null;
  transaction_hash: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface SendPaymentRequest {
  receiver_address: string;
  amount: number;
  asset_type: string;
  asset_id?: number | null;
  description?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const companyAPI = {
  register: async (data: { companyName: string; email: string; password: string }): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post("/company/register", data);
    return response.data;
  },
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post("/company/login", data);
    return response.data;
  },
  getProfile: async (): Promise<{ success: boolean; data?: Company; error?: string }> => {
    const response = await api.get("/company/profile");
    return response.data;
  },
  updatePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> => {
    const response = await api.put("/company/password", data);
    return response.data;
  },
  search: async (q: string): Promise<{ success: boolean; data?: CompanySearchResult[]; error?: string }> => {
    const response = await api.get(`/companies/search?q=${encodeURIComponent(q)}`);
    return response.data;
  },
};

export const treasuryAPI = {
  getBalance: async (companyId: number): Promise<{ success: boolean; data?: TreasuryBalance; error?: string }> => {
    const response = await api.get(`/treasury/balance/${companyId}`);
    return response.data;
  },
  getTransactions: async (
    companyId: number,
    limit?: number,
    nextToken?: string,
  ): Promise<{ success: boolean; data?: TransactionHistory; error?: string }> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (nextToken) params.append("nextToken", nextToken);
    const response = await api.get(`/treasury/transactions/${companyId}?${params.toString()}`);
    return response.data;
  },
  sendTransaction: async (
    data: SendTransactionRequest,
  ): Promise<{ success: boolean; data?: { transactionId: string; explorerUrl: string }; error?: string }> => {
    const response = await api.post("/treasury/send", data);
    return response.data;
  },
  getAuditLog: async (
    companyId: number,
    limit?: number,
    offset?: number,
    operationType?: string,
  ): Promise<{ success: boolean; data?: AuditLogEntry[]; error?: string }> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    if (operationType) params.append("operationType", operationType);
    const response = await api.get(`/treasury/audit/${companyId}?${params.toString()}`);
    return response.data;
  },
  getAssetInfo: async (assetId: number): Promise<{ success: boolean; data?: any; error?: string }> => {
    const response = await api.get(`/treasury/asset/${assetId}`);
    return response.data;
  },
  getSummary: async (): Promise<{ success: boolean; data?: TreasurySummary; error?: string }> => {
    const response = await api.get("/treasury/summary");
    return response.data;
  },
  getAnalytics: async (): Promise<{ success: boolean; data?: TreasuryAnalytics; error?: string }> => {
    const response = await api.get("/treasury/analytics");
    return response.data;
  },
  getRecommendations: async (): Promise<{ success: boolean; data?: Recommendation[]; error?: string }> => {
    const response = await api.get("/treasury/recommendations");
    return response.data;
  },
  getAIRecommendations: async (): Promise<{ success: boolean; data?: AIRecommendation[]; error?: string }> => {
    const response = await api.get("/treasury/ai-recommendations");
    return response.data;
  },
  getAIData: async (): Promise<{ success: boolean; data?: AITreasuryData; error?: string }> => {
    const response = await api.get("/treasury/ai-data");
    return response.data;
  },
  optInAsset: async (
    assetId: number,
  ): Promise<{ success: boolean; data?: { transactionId: string; explorerUrl: string }; error?: string }> => {
    const response = await api.post("/treasury/optin", { assetId });
    return response.data;
  },
};

export const invoiceAPI = {
  create: async (formData: FormData): Promise<{ success: boolean; data?: Invoice; error?: string }> => {
    const response = await api.post("/invoices", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  getInbox: async (filters?: InvoiceInboxFilters): Promise<{ success: boolean; data?: Invoice[]; error?: string }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.direction) params.append("direction", filters.direction);
    if (filters?.currency) params.append("currency", filters.currency);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    const response = await api.get(`/invoices/inbox?${params.toString()}`);
    return response.data;
  },
  getSummary: async (): Promise<{ success: boolean; data?: InvoiceSummary; error?: string }> => {
    const response = await api.get("/invoices/summary");
    return response.data;
  },
  getById: async (id: number): Promise<{ success: boolean; data?: Invoice; error?: string }> => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },
  getReceiptUrl: (id: number): string => `${API_BASE_URL}/invoices/${id}/receipt`,
  approve: async (id: number): Promise<{ success: boolean; data?: Invoice; error?: string }> => {
    const response = await api.post(`/invoices/${id}/approve`);
    return response.data;
  },
  reject: async (id: number, reason: string): Promise<{ success: boolean; data?: Invoice; error?: string }> => {
    const response = await api.post(`/invoices/${id}/reject`, { reason });
    return response.data;
  },
  cancel: async (id: number): Promise<{ success: boolean; data?: Invoice; error?: string }> => {
    const response = await api.post(`/invoices/${id}/cancel`);
    return response.data;
  },
  pay: async (
    id: number,
    confirmed?: boolean,
  ): Promise<{ success: boolean; data?: Invoice; requiresConfirmation?: boolean; overage?: string; error?: string }> => {
    const response = await api.post(`/invoices/${id}/pay`, { confirmed });
    return response.data;
  },
};

export const budgetAPI = {
  create: async (data: {
    name: string;
    currency: string;
    asset_id?: number | null;
    limit_amount: string;
    period: "monthly" | "quarterly";
  }): Promise<{ success: boolean; data?: Budget; error?: string }> => {
    const response = await api.post("/budgets", data);
    return response.data;
  },
  list: async (): Promise<{ success: boolean; data?: Budget[]; error?: string }> => {
    const response = await api.get("/budgets");
    return response.data;
  },
  getById: async (id: number): Promise<{ success: boolean; data?: Budget; error?: string }> => {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  },
  update: async (
    id: number,
    data: Partial<{ name: string; currency: string; limit_amount: string; period: string }>,
  ): Promise<{ success: boolean; data?: Budget; error?: string }> => {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<{ success: boolean; error?: string }> => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },
};

export const notificationAPI = {
  list: async (): Promise<{ success: boolean; data?: Notification[]; error?: string }> => {
    const response = await api.get("/notifications");
    return response.data;
  },
  getUnreadCount: async (): Promise<{ success: boolean; data?: { count: number }; error?: string }> => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },
  markRead: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },
  markAllRead: async (): Promise<{ success: boolean }> => {
    const response = await api.post("/notifications/read-all");
    return response.data;
  },
};

// ─── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatSession {
  id: number;
  company_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  company_id: number;
  role: "user" | "assistant";
  content: string;
  intent: string | null;
  action_data: any | null;
  tx_result: any | null;
  created_at: string;
}

export const chatAPI = {
  listSessions: async (): Promise<{ success: boolean; data?: ChatSession[] }> => {
    const r = await api.get("/chat/sessions");
    return r.data;
  },
  createSession: async (): Promise<{ success: boolean; data?: ChatSession }> => {
    const r = await api.post("/chat/sessions");
    return r.data;
  },
  deleteSession: async (id: number): Promise<{ success: boolean }> => {
    const r = await api.delete(`/chat/sessions/${id}`);
    return r.data;
  },
  getMessages: async (sessionId: number): Promise<{ success: boolean; data?: ChatMessage[] }> => {
    const r = await api.get(`/chat/sessions/${sessionId}/messages`);
    return r.data;
  },
  sendMessage: async (sessionId: number, content: string): Promise<{ success: boolean; data?: ChatMessage }> => {
    const r = await api.post(`/chat/sessions/${sessionId}/message`, { content });
    return r.data;
  },
  confirmAction: async (sessionId: number): Promise<{ success: boolean; data?: ChatMessage }> => {
    const r = await api.post(`/chat/sessions/${sessionId}/confirm`);
    return r.data;
  },
};

export const paymentAPI = {
  send: async (data: SendPaymentRequest): Promise<{ success: boolean; data?: Payment; error?: string }> => {
    const response = await api.post("/payments/send", data);
    return response.data;
  },
  getHistory: async (limit?: number, offset?: number): Promise<{ success: boolean; data?: Payment[]; error?: string }> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (offset) params.append("offset", String(offset));
    const response = await api.get(`/payments/history?${params.toString()}`);
    return response.data;
  },
};

export default api;
