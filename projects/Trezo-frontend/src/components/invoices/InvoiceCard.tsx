import React from "react";
import { Invoice } from "../../services/api";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, Ban, AlertCircle, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";

interface Props {
  invoice: Invoice;
  currentCompanyId: number;
  onClick: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending_approval: <Clock className="h-3.5 w-3.5" />,
  approved: <CheckCircle className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
  paid: <CheckCircle className="h-3.5 w-3.5" />,
  cancelled: <Ban className="h-3.5 w-3.5" />,
  draft: <AlertCircle className="h-3.5 w-3.5" />,
};

const VERIFY_ICONS: Record<string, React.ReactNode> = {
  matched: <ShieldCheck className="h-3.5 w-3.5 text-green-500" aria-label="AI verified" />,
  mismatch: <ShieldAlert className="h-3.5 w-3.5 text-red-500" aria-label="Amount mismatch" />,
  unverifiable: <ShieldOff className="h-3.5 w-3.5 text-gray-400" aria-label="Unverifiable" />,
};

const InvoiceCard: React.FC<Props> = ({ invoice, currentCompanyId, onClick }) => {
  const isSender = invoice.sender_company_id === currentCompanyId;
  const counterparty = isSender ? invoice.receiver_company_name : invoice.sender_company_name;
  const direction = isSender ? "To" : "From";

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{direction}</span>
          <span className="text-sm font-medium text-gray-900 truncate">{counterparty}</span>
          {VERIFY_ICONS[invoice.verification_status]}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(invoice.created_at), "MMM d, yyyy")}</p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <span className="text-sm font-semibold text-gray-800">
          {invoice.amount} {invoice.currency}
        </span>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[invoice.status]}`}>
          {STATUS_ICONS[invoice.status]}
          {invoice.status.replace("_", " ")}
        </span>
      </div>
    </div>
  );
};

export default InvoiceCard;
