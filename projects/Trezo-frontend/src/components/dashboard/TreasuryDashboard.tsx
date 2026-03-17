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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight">Trezo Treasury</h1>
              <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{company.companyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <NotificationBell />
            <button
              onClick={() => setShowInvoicePage(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border border-indigo-200 text-indigo-600 text-xs sm:text-sm rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Invoices</span>
            </button>
            <button
              onClick={() => setShowPaymentsPage(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border border-purple-200 text-purple-600 text-xs sm:text-sm rounded-lg hover:bg-purple-50 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Payments</span>
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-indigo-600 text-white text-xs sm:text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 sm:p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={logout}
              className="p-1.5 sm:p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <TreasurySummaryCard
          summary={summary}
          walletAddress={company.walletAddress}
          isLoading={loadingSummary}
          onOptInSuccess={handleRefresh}
        />
        <AnalyticsCards analytics={analytics} isLoading={loadingAnalytics} />

        {/* Invoice Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`${bg} p-1.5 rounded-lg flex-shrink-0`}>
                  <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${color}`} />
                </div>
                <span className="text-xs text-gray-500 leading-tight">{label}</span>
              </div>
              {loadingInvoiceSummary ? (
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
              ) : (
                <p className={`text-base sm:text-lg font-bold ${color} truncate`}>{value ?? "—"}</p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowInvoicePage(true)}
          className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-semibold">Invoice & Payment Center</p>
              <p className="text-xs text-indigo-200 hidden sm:block">Create invoices, approve payments, manage budgets</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        </button>

        {/* Asset Allocation + AI CFO Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
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
