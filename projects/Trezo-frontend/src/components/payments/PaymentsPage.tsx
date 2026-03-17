import React, { useState, useEffect, useCallback } from "react";
import { paymentAPI, Payment } from "../../services/api";
import PaymentForm from "./PaymentForm";
import PaymentHistory from "./PaymentHistory";
import { ArrowLeft, Send, History } from "lucide-react";

interface Props {
  onBack: () => void;
}

const PaymentsPage: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<"send" | "history">("send");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getHistory();
      if (res.success && res.data) setPayments(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-gray-900">Supplier Payments</h1>
        </div>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 flex gap-1 pb-0">
          <button
            onClick={() => setTab("send")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "send" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <Send className="h-4 w-4" /> Send Payment
          </button>
          <button
            onClick={() => {
              setTab("history");
              loadHistory();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "history" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <History className="h-4 w-4" /> History
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {tab === "send" && (
          <PaymentForm
            onSuccess={() => {
              loadHistory();
              setTab("history");
            }}
          />
        )}
        {tab === "history" && <PaymentHistory payments={payments} loading={loading} />}
      </main>
    </div>
  );
};

export default PaymentsPage;
