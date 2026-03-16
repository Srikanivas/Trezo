import React from "react";
import { Payment } from "../../services/api";
import { CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

interface Props {
  payments: Payment[];
  loading: boolean;
}

const STATUS_CONFIG = {
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  pending: { label: "Pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
};

const EXPLORER_BASE = "https://testnet.algoexplorer.io/tx/";

const PaymentHistory: React.FC<Props> = ({ payments, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (!payments.length) {
    return <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">No payments yet.</div>;
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => {
        const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
        const StatusIcon = cfg.icon;
        return (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {p.amount} {p.asset_type}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">To: {p.receiver_address}</p>
                {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                {p.transaction_hash && (
                  <a
                    href={`${EXPLORER_BASE}${p.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {p.transaction_hash.slice(0, 16)}...
                  </a>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PaymentHistory;
