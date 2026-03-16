import React, { useState } from "react";
import { invoiceAPI, CompanySearchResult, AssetHolding } from "../../services/api";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import CompanySearchInput from "./CompanySearchInput";
import CurrencySelector from "./CurrencySelector";
import ReceiptUpload from "./ReceiptUpload";

interface Props {
  walletAssets: AssetHolding[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInvoiceModal: React.FC<Props> = ({ walletAssets, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState<CompanySearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ALGO");
  const [assetId, setAssetId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [autopay, setAutopay] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!recipient || !amount || !message) {
      setError("All fields are required");
      return;
    }
    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("receiver_company_id", String(recipient.id));
      fd.append("amount", amount);
      fd.append("currency", currency);
      if (assetId !== null) fd.append("asset_id", String(assetId));
      fd.append("message", message);
      fd.append("autopay_enabled", String(autopay));
      if (file) fd.append("receipt", file);

      const res = await invoiceAPI.create(fd);
      if (res.success) {
        onSuccess();
        onClose();
      } else setError(res.error || "Failed to create invoice");
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Invoice — Step {step}/3</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Step 1: Recipient */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Recipient Company</label>
              <CompanySearchInput selected={recipient} onSelect={setRecipient} onClear={() => setRecipient(null)} />
            </div>
          )}

          {/* Step 2: Amount + Message + Autopay */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <CurrencySelector
                  assets={walletAssets}
                  selected={{ currency, assetId }}
                  onChange={(c, a) => {
                    setCurrency(c);
                    setAssetId(a);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Describe the payment request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={autopay} onChange={(e) => setAutopay(e.target.checked)} className="rounded" />
                <span className="text-sm text-gray-700">Enable Autopay (pay automatically when approved)</span>
              </label>
            </div>
          )}

          {/* Step 3: Receipt */}
          {step === 3 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Receipt Image (optional)</label>
              <ReceiptUpload file={file} onChange={setFile} />
              <p className="text-xs text-gray-400">An AI agent will scan the receipt and verify the amount.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => {
                  setError("");
                  if (step === 1 && !recipient) {
                    setError("Please select a recipient");
                    return;
                  }
                  setStep((s) => s + 1);
                }}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invoice"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
