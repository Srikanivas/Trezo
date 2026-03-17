import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/useAuth";
import { treasuryAPI, AssetHolding } from "../../services/api";
import InvoiceInbox from "./InvoiceInbox";
import BudgetPanel from "./BudgetPanel";
import CreateInvoiceModal from "./CreateInvoiceModal";
import { Plus, Inbox, PieChart, ArrowLeft } from "lucide-react";

interface Props {
  onBack: () => void;
}

const InvoicePage: React.FC<Props> = ({ onBack }) => {
  const { company } = useAuth();
  const [tab, setTab] = useState<"inbox" | "budgets">("inbox");
  const [showCreate, setShowCreate] = useState(false);
  const [walletAssets, setWalletAssets] = useState<AssetHolding[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!company) return;
    treasuryAPI.getBalance(company.id).then((res) => {
      if (res.success && res.data) setWalletAssets(res.data.assets);
    });
  }, [company]);

  if (!company) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">Invoices & Payments</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-indigo-600 text-white text-xs sm:text-sm rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">New </span>Invoice
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 flex gap-1 pb-0">
          <button
            onClick={() => setTab("inbox")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "inbox" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <Inbox className="h-4 w-4" /> Inbox
          </button>
          <button
            onClick={() => setTab("budgets")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "budgets" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <PieChart className="h-4 w-4" /> Budgets
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {tab === "inbox" && <InvoiceInbox key={refreshKey} currentCompanyId={company.id} onRefresh={() => setRefreshKey((k) => k + 1)} />}
        {tab === "budgets" && <BudgetPanel />}
      </main>

      {showCreate && (
        <CreateInvoiceModal
          walletAssets={walletAssets}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};

export default InvoicePage;
