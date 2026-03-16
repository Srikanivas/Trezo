import React, { useState } from "react";
import { TreasurySummary } from "../../services/api";
import { Vault, Copy, CheckCircle, ExternalLink, Zap, DollarSign, Coins, QrCode } from "lucide-react";
import { getAddressUrl } from "../../config/explorer";
import AssetOptInModal from "./AssetOptInModal";
import WalletQRModal from "./WalletQRModal";

interface Props {
  summary: TreasurySummary | null;
  walletAddress: string;
  isLoading: boolean;
  onOptInSuccess?: () => void;
}

const USDC_ASSET_ID = 10458941;

const TreasurySummaryCard: React.FC<Props> = ({ summary, walletAddress, isLoading, onOptInSuccess }) => {
  const [copied, setCopied] = useState(false);
  const [showOptIn, setShowOptIn] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usdcAsset = summary?.assets.find((a) => a.assetId === USDC_ASSET_ID);
  const otherAssets = summary?.assets.filter((a) => a.assetId !== 0 && a.assetId !== USDC_ASSET_ID) ?? [];
  const alreadyOptedIn = summary?.assets.map((a) => a.assetId) ?? [];

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl shadow-lg p-6 text-white">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Vault className="h-5 w-5 text-indigo-200" />
            <span className="text-indigo-200 font-medium text-sm uppercase tracking-wide">Treasury Wallet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-500/40 px-2 py-1 rounded-full">Algorand TestNet</span>
            <button
              onClick={() => setShowOptIn(true)}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors"
              title="Opt-in to new asset"
            >
              <Zap className="h-3 w-3" /> Opt-In
            </button>
          </div>
        </div>

        {/* Asset balances grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* ALGO */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Coins className="h-3.5 w-3.5 text-indigo-200" />
              <span className="text-xs text-indigo-200 font-medium">ALGO</span>
            </div>
            {isLoading ? (
              <div className="h-6 bg-white/20 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold">{summary ? summary.algoBalance.toFixed(4) : "0.0000"}</p>
            )}
          </div>

          {/* USDC */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-indigo-200" />
              <span className="text-xs text-indigo-200 font-medium">USDC</span>
            </div>
            {isLoading ? (
              <div className="h-6 bg-white/20 rounded animate-pulse" />
            ) : usdcAsset ? (
              <p className="text-xl font-bold">{usdcAsset.balance.toFixed(2)}</p>
            ) : (
              <button
                onClick={() => setShowOptIn(true)}
                className="text-xs text-indigo-200 hover:text-white underline underline-offset-2 mt-1"
              >
                + Opt-In
              </button>
            )}
          </div>

          {/* Other assets or total */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Vault className="h-3.5 w-3.5 text-indigo-200" />
              <span className="text-xs text-indigo-200 font-medium">Total Value</span>
            </div>
            {isLoading ? (
              <div className="h-6 bg-white/20 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold">
                {summary ? summary.totalTreasuryValue.toFixed(3) : "0.000"}
                <span className="text-xs font-normal text-indigo-200 ml-1">ALGO</span>
              </p>
            )}
          </div>
        </div>

        {/* Other ASA holdings */}
        {!isLoading && otherAssets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {otherAssets.map((a) => (
              <div key={a.assetId} className="bg-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-xs font-semibold">{a.unitName || `ASA-${a.assetId}`}</span>
                <span className="text-xs text-indigo-200">{a.balance.toFixed(a.decimals > 4 ? 2 : a.decimals)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pending receivables */}
        {summary && summary.pendingInvoicesValue > 0 && (
          <p className="text-indigo-200 text-xs mb-3">Pending receivables: {summary.pendingInvoicesValue.toLocaleString()} units</p>
        )}

        {/* Wallet address */}
        <div className="flex items-center gap-2 bg-indigo-500/30 rounded-lg px-3 py-2">
          <span className="font-mono text-xs text-indigo-100 truncate flex-1">{walletAddress}</span>
          <button onClick={copyAddress} className="text-indigo-200 hover:text-white flex-shrink-0" title="Copy address">
            {copied ? <CheckCircle className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4" />}
          </button>
          <button onClick={() => setShowQR(true)} className="text-indigo-200 hover:text-white flex-shrink-0" title="Show QR code">
            <QrCode className="h-4 w-4" />
          </button>
          <a
            href={getAddressUrl(walletAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-200 hover:text-white flex-shrink-0"
            title="View on explorer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <AssetOptInModal
        isOpen={showOptIn}
        onClose={() => setShowOptIn(false)}
        onSuccess={() => {
          setShowOptIn(false);
          onOptInSuccess?.();
        }}
        alreadyOptedIn={alreadyOptedIn}
      />

      {showQR && <WalletQRModal address={walletAddress} onClose={() => setShowQR(false)} />}
    </>
  );
};

export default TreasurySummaryCard;
