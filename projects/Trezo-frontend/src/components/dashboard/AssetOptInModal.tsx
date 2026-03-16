import React, { useState } from "react";
import { treasuryAPI } from "../../services/api";
import { X, CheckCircle, ExternalLink, Loader2, Zap, Search } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  alreadyOptedIn: number[]; // list of assetIds already held
}

// Well-known TestNet ASAs — pre-filled quick-select options
const KNOWN_ASSETS = [
  { assetId: 10458941, name: "USDC", unitName: "USDC", decimals: 6, description: "USD Coin (Circle) — TestNet" },
  { assetId: 67395862, name: "USDT", unitName: "USDT", decimals: 6, description: "Tether USD — TestNet" },
  { assetId: 152592037, name: "gALGO", unitName: "gALGO", decimals: 6, description: "Governance ALGO — TestNet" },
];

const AssetOptInModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, alreadyOptedIn }) => {
  const [assetId, setAssetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ transactionId: string; explorerUrl: string } | null>(null);

  if (!isOpen) return null;

  const selectPreset = (id: number) => {
    setAssetId(String(id));
    setError("");
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const id = parseInt(assetId);
    if (!id || id <= 0) {
      setError("Enter a valid asset ID.");
      return;
    }
    if (alreadyOptedIn.includes(id)) {
      setError("Wallet is already opted in to this asset.");
      return;
    }

    setLoading(true);
    try {
      const res = await treasuryAPI.optInAsset(id);
      if (!res.success) throw new Error(res.error || "Opt-in failed");
      setSuccess(res.data!);
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Opt-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setAssetId("");
    setError("");
    setSuccess(null);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Opt-In to Asset</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          /* Success state */
          <div className="px-6 py-8 text-center">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Opt-In Successful</h3>
            <p className="text-sm text-gray-500 mb-4">Your wallet can now receive this asset.</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
              <p className="font-mono text-xs text-gray-800 break-all">{success.transactionId}</p>
            </div>
            <div className="flex gap-3">
              <a
                href={success.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700"
              >
                <ExternalLink className="h-4 w-4" /> View on Explorer
              </a>
              <button
                onClick={handleDone}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Quick-select known assets */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Select</p>
              <div className="space-y-2">
                {KNOWN_ASSETS.map((a) => {
                  const optedIn = alreadyOptedIn.includes(a.assetId);
                  const selected = assetId === String(a.assetId);
                  return (
                    <button
                      key={a.assetId}
                      type="button"
                      disabled={optedIn}
                      onClick={() => selectPreset(a.assetId)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all
                        ${
                          optedIn
                            ? "border-green-200 bg-green-50 opacity-70 cursor-not-allowed"
                            : selected
                              ? "border-indigo-400 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{a.unitName}</span>
                          <span className="text-xs text-gray-400">#{a.assetId}</span>
                          {optedIn && <span className="text-xs text-green-600 font-medium">✓ Opted In</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>
                      </div>
                      {selected && !optedIn && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom asset ID input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Custom Asset ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={assetId}
                  onChange={(e) => {
                    setAssetId(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter any ASA ID (e.g. 10458941)"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700">
                Opt-in requires a minimum balance of <strong>0.1 ALGO</strong> per asset and a small transaction fee (~0.001 ALGO).
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !assetId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {loading ? "Processing..." : "Opt-In"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AssetOptInModal;
