import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/useAuth";
import { treasuryAPI, invoiceAPI, TreasurySummary, TreasuryAnalytics, InvoiceSummary } from "../../services/api";
import {
  RefreshCw,
  Send,
  LogOut,
  Building2,
  FileText,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import TreasurySummaryCard from "./TreasurySummaryCard";
import AssetAllocationChart from "./AssetAllocationChart";
import AnalyticsCards from "./AnalyticsCards";
import RecentTransactionsCard from "./RecentTransactionsCard";
import AICFOChatPanel, { AICFOChatPanelHandle } from "./AICFOChatPanel";
import SendTransactionModal from "./SendTransactionModal";
import NotificationBell from "../invoices/NotificationBell";
import InvoicePage from "../invoices/InvoicePage";
import PaymentsPage from "../payments/PaymentsPage";

const TreasuryDashboard: React.FC = () => {
  const { company, logout } = useAuth();

  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [analytics, setAnalytics] = useState<TreasuryAnalytics | null>(null);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingInvoiceSummary, setLoadingInvoiceSummary] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showInvoicePage, setShowInvoicePage] = useState(false);
  const [showPaymentsPage, setShowPaymentsPage] = useState(false);
  const chatRef = useRef<AICFOChatPanelHandle>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await treasuryAPI.getSummary();
      if (res.success && res.data) setSummary(res.data);
    } catch {
      setError("Failed to load treasury summary");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await treasuryAPI.getAnalytics();
      if (res.success && res.data) setAnalytics(res.data);
    } catch {
      /* non-critical */
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const loadInvoiceSummary = useCallback(async () => {
    setLoadingInvoiceSummary(true);
    try {
      const res = await invoiceAPI.getSummary();
      if (res.success && res.data) setInvoiceSummary(res.data);
    } catch {
      /* non-critical */
    } finally {
      setLoadingInvoiceSummary(false);
    }
  }, []);

  const loadAll = useCallback(() => {
    setError("");
    loadSummary();
    loadAnalytics();
    loadInvoiceSummary();
  }, [loadSummary, loadAnalytics, loadInvoiceSummary]);

  useEffect(() => {
    if (company) loadAll();
  }, [company, loadAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll();
    setTimeout(() => setRefreshing(false), 1500);
  };

  if (!company) return null;

  if (showInvoicePage) {
    return (
      <InvoicePage
        onBack={() => {
          setShowInvoicePage(false);
          loadAll();
        }}
      />
    );
  }
  if (showPaymentsPage) {
    return (
      <PaymentsPage
        onBack={() => {
          setShowPaymentsPage(false);
          loadAll();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Trezo Treasury</h1>
              <p className="text-xs text-gray-500">{company.companyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setShowInvoicePage(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-indigo-200 text-indigo-600 text-sm rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoices</span>
            </button>
            <button
              onClick={() => setShowPaymentsPage(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-purple-200 text-purple-600 text-sm rounded-lg hover:bg-purple-50 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send Payment</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <TreasurySummaryCard
          summary={summary}
          walletAddress={company.walletAddress}
          isLoading={loadingSummary}
          onOptInSuccess={handleRefresh}
        />
        <AnalyticsCards analytics={analytics} isLoading={loadingAnalytics} />

        {/* Invoice Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Payables", value: invoiceSummary?.total_payables, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
            {
              label: "Receivables",
              value: invoiceSummary?.total_receivables,
              icon: TrendingUp,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Paid This Month",
              value: invoiceSummary?.paid_this_month,
              icon: CheckCircle,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              label: "Pending Approval",
              value: invoiceSummary?.pending_approval_count !== undefined ? String(invoiceSummary.pending_approval_count) : undefined,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`${bg} p-1.5 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              {loadingInvoiceSummary ? (
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className={`text-lg font-bold ${color}`}>{value ?? "—"}</p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowInvoicePage(true)}
          className="w-full flex items-center justify-between px-5 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            <div className="text-left">
              <p className="text-sm font-semibold">Invoice & Payment Center</p>
              <p className="text-xs text-indigo-200">Create invoices, approve payments, manage budgets</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5" />
        </button>

        {/* Asset Allocation + AI CFO Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <AssetAllocationChart
              assets={summary?.assets ?? []}
              isLoading={loadingSummary}
              onQuickAction={(hint) => chatRef.current?.prefill(hint)}
            />
          </div>
          <div className="lg:col-span-3">
            <AICFOChatPanel ref={chatRef} />
          </div>
        </div>

        <RecentTransactionsCard
          transactions={summary?.recentTransactions ?? []}
          walletAddress={company.walletAddress}
          isLoading={loadingSummary}
        />
      </main>

      {showSendModal && (
        <SendTransactionModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            setShowSendModal(false);
            handleRefresh();
          }}
          balance={null}
        />
      )}
    </div>
  );
};

export default TreasuryDashboard;
