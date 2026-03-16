import React, { useState } from "react";
import { Invoice, invoiceAPI } from "../../services/api";
import { X, ShieldAlert, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import BudgetWarningModal from "./BudgetWarningModal";

interface Props {
  invoice: Invoice;
  currentCompanyId: number;
  onClose: () => void;
  onRefresh: () => void;
}

const InvoiceDetailModal: React.FC<Props> = ({ invoice, currentCompanyId, onClose, onRefresh }) => {
  const isSender = invoice.sender_company_id === currentCompanyId;
  const isReceiver = invoice.receiver_company_id === currentCompanyId;

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [budgetWarning, setBudgetWarning] = useState<{ overage: string } | null>(null);

  async function handleAction(action: () => Promise<any>) {
    setLoading(true);
    setError("");
    try {
      await action();
      onRefresh();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(confirmed = false) {
    setLoading(true);
    setError("");
    try {
      const res = await invoiceAPI.pay(invoice.id, confirmed);
      if (res.requiresConfirmation && res.overage) {
        setBudgetWarning({ overage: res.overage });
      } else {
        onRefresh();
        onClose();
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  const receiptUrl = invoice.receipt_image_id
    ? `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api/v1"}/invoices/${invoice.id}/receipt`
    : null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Invoice #{invoice.id}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Parties */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">From</p>
                <p className="font-medium">{invoice.sender_company_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">To</p>
                <p className="font-medium">{invoice.receiver_company_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Amount</p>
                <p className="font-semibold text-lg">
                  {invoice.amount} {invoice.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <p className="font-medium capitalize">{invoice.status.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Created</p>
                <p>{format(new Date(invoice.created_at), "MMM d, yyyy HH:mm")}</p>
              </div>
              {invoice.transaction_id && (
                <div>
                  <p className="text-xs text-gray-400">Tx ID</p>
                  <a
                    href={`https://testnet.algoexplorer.io/tx/${invoice.transaction_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 text-xs flex items-center gap-1"
                  >
                    {invoice.transaction_id.slice(0, 12)}... <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Message</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{invoice.message}</p>
            </div>

            {/* AI Verification */}
            {invoice.verification_status === "mismatch" && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                AI verification detected a discrepancy between the declared amount and the scanned bill.
              </div>
            )}
            {invoice.bill_summary && (
              <div>
                <p className="text-xs text-gray-400 mb-1">AI Bill Summary</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 space-y-1">
                  {invoice.bill_summary.vendorName && <p>Vendor: {invoice.bill_summary.vendorName}</p>}
                  {invoice.bill_summary.total && <p>Extracted Total: {invoice.bill_summary.total}</p>}
                  {invoice.bill_summary.tax && <p>Tax: {invoice.bill_summary.tax}</p>}
                </div>
              </div>
            )}

            {/* Receipt */}
            {receiptUrl && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Receipt</p>
                <a href={receiptUrl} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={receiptUrl}
                    alt="receipt"
                    className="max-h-48 rounded-lg border border-gray-200 object-contain w-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </a>
              </div>
            )}

            {/* Rejection reason */}
            {invoice.rejection_reason && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{invoice.rejection_reason}</p>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {isReceiver && invoice.status === "pending_approval" && !showRejectInput && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(() => invoiceAPI.approve(invoice.id))}
                    disabled={loading}
                    className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={loading}
                    className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
              {showRejectInput && (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (min 10 characters)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAction(() => invoiceAPI.reject(invoice.id, rejectReason))}
                      disabled={loading || rejectReason.trim().length < 10}
                      className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
              {isSender && invoice.status === "approved" && (
                <button
                  onClick={() => handlePay(false)}
                  disabled={loading}
                  className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Pay Now"}
                </button>
              )}
              {isSender && invoice.status === "pending_approval" && (
                <button
                  onClick={() => handleAction(() => invoiceAPI.cancel(invoice.id))}
                  disabled={loading}
                  className="w-full py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {budgetWarning && (
        <BudgetWarningModal
          overage={budgetWarning.overage}
          currency={invoice.currency}
          onConfirm={() => {
            setBudgetWarning(null);
            handlePay(true);
          }}
          onCancel={() => setBudgetWarning(null)}
        />
      )}
    </>
  );
};

export default InvoiceDetailModal;
