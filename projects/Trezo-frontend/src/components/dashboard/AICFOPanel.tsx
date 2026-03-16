import React, { useState, useEffect, useCallback } from "react";
import { treasuryAPI, AIRecommendation, AITreasuryData } from "../../services/api";
import {
  Bot,
  AlertTriangle,
  Info,
  CheckCircle,
  RefreshCw,
  Droplets,
  PieChart,
  TrendingDown,
  Clock,
  Zap,
  BarChart2,
  Shuffle,
} from "lucide-react";

const TYPE_CONFIG: Record<
  AIRecommendation["type"],
  {
    icon: React.ElementType;
    label: string;
    bg: string;
    border: string;
    text: string;
    iconColor: string;
  }
> = {
  LIQUIDITY: {
    icon: Droplets,
    label: "Liquidity Risk",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    iconColor: "text-red-500",
  },
  CONCENTRATION: {
    icon: PieChart,
    label: "Concentration Risk",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    iconColor: "text-amber-500",
  },
  IDLE_CAPITAL: {
    icon: Zap,
    label: "Idle Capital",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    iconColor: "text-blue-500",
  },
  INVOICE_REMINDER: {
    icon: Clock,
    label: "Invoice Reminder",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    iconColor: "text-orange-500",
  },
  LARGE_TX_ALERT: {
    icon: AlertTriangle,
    label: "Large Transaction",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    iconColor: "text-red-500",
  },
  MARKET_VOLATILITY: {
    icon: BarChart2,
    label: "Market Volatility",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    iconColor: "text-purple-500",
  },
  DIVERSIFICATION: {
    icon: Shuffle,
    label: "Diversification",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-800",
    iconColor: "text-indigo-500",
  },
  HEALTHY: {
    icon: CheckCircle,
    label: "Healthy",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    iconColor: "text-green-500",
  },
};

const SEVERITY_ICON: Record<AIRecommendation["severity"], React.ElementType> = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

interface Props {
  compactMode?: boolean;
}

const AICFOPanel: React.FC<Props> = ({ compactMode = false }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [aiData, setAIData] = useState<AITreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showData, setShowData] = useState(false);

  const load = useCallback(async () => {
    try {
      const [recRes, dataRes] = await Promise.all([treasuryAPI.getAIRecommendations(), treasuryAPI.getAIData()]);
      if (recRes.success && recRes.data) setRecommendations(recRes.data);
      if (dataRes.success && dataRes.data) setAIData(dataRes.data);
      setLastUpdated(new Date());
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">AI CFO Insights</h2>
            {lastUpdated && <p className="text-xs text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!compactMode && aiData && (
            <button onClick={() => setShowData((v) => !v)} className="text-xs text-indigo-600 hover:underline">
              {showData ? "Hide data" : "View data"}
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-white/60 transition-colors disabled:opacity-50"
            title="Refresh insights"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Market Prices Strip */}
      {!loading && aiData && aiData.marketPrices.length > 0 && (
        <div className="flex gap-4 px-5 py-2 bg-gray-50 border-b border-gray-100 overflow-x-auto">
          {aiData.marketPrices.map((p) => (
            <div key={p.symbol} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs font-semibold text-gray-700">{p.symbol}</span>
              <span className="text-xs text-gray-500">${p.usdPrice.toFixed(4)}</span>
              {p.change24h !== null && (
                <span className={`text-xs font-medium ${p.change24h >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {p.change24h >= 0 ? "+" : ""}
                  {p.change24h.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
          {aiData.totalTreasuryValueUSD > 0 && (
            <div className="flex items-center gap-1.5 whitespace-nowrap ml-auto">
              <span className="text-xs text-gray-400">Treasury USD</span>
              <span className="text-xs font-bold text-indigo-700">${aiData.totalTreasuryValueUSD.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="p-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No insights available.</p>
        ) : (
          recommendations.map((rec, i) => {
            const cfg = TYPE_CONFIG[rec.type] ?? TYPE_CONFIG.HEALTHY;
            const TypeIcon = cfg.icon;
            const SevIcon = SEVERITY_ICON[rec.severity];
            return (
              <div key={i} className={`rounded-xl border p-3.5 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-2.5">
                  <TypeIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                      <SevIcon className={`h-3 w-3 ${cfg.iconColor}`} />
                    </div>
                    <p className={`text-xs leading-relaxed ${cfg.text}`}>{rec.message}</p>
                    <p className={`text-xs mt-1 font-medium ${cfg.text} opacity-80`}>→ {rec.recommendation}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Raw AI Data (expandable) */}
      {showData && aiData && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 mb-2">Treasury Snapshot</p>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div>
              <span className="text-gray-400">Total Value</span>
              <p className="font-semibold">{aiData.totalTreasuryValue.toFixed(3)} ALGO</p>
            </div>
            <div>
              <span className="text-gray-400">USD Equivalent</span>
              <p className="font-semibold">${aiData.totalTreasuryValueUSD.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-400">Pending Invoices</span>
              <p className="font-semibold">{aiData.pendingInvoices.length}</p>
            </div>
            <div>
              <span className="text-gray-400">Pending Payments</span>
              <p className="font-semibold">{aiData.scheduledPayments.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICFOPanel;
