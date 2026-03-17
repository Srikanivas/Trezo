import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AssetAllocation, AIRecommendation, treasuryAPI } from "../../services/api";
import { Lightbulb, TrendingUp, AlertTriangle, Info, CheckCircle2, Send, FileText, PiggyBank, Wallet } from "lucide-react";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const SEVERITY_STYLES = {
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle, iconColor: "text-amber-500" },
  info: { bg: "bg-blue-50", border: "border-blue-200", icon: Info, iconColor: "text-blue-500" },
  success: { bg: "bg-green-50", border: "border-green-200", icon: CheckCircle2, iconColor: "text-green-500" },
};

const QUICK_ACTIONS = [
  { label: "Send Payment", icon: Send, color: "text-indigo-600", bg: "bg-indigo-50", hint: 'Try: "Send 5 ALGO to..."' },
  { label: "New Invoice", icon: FileText, color: "text-purple-600", bg: "bg-purple-50", hint: 'Try: "Create invoice for..."' },
  { label: "Opt-In Asset", icon: Wallet, color: "text-cyan-600", bg: "bg-cyan-50", hint: 'Try: "Opt in to USDC"' },
  { label: "Set Budget", icon: PiggyBank, color: "text-emerald-600", bg: "bg-emerald-50", hint: 'Try: "Create monthly budget..."' },
];

interface Props {
  assets: AssetAllocation[];
  isLoading: boolean;
  onQuickAction?: (hint: string) => void;
}

const AssetAllocationChart: React.FC<Props> = ({ assets, isLoading, onQuickAction }) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loadingRec, setLoadingRec] = useState(true);

  useEffect(() => {
    treasuryAPI
      .getAIRecommendations()
      .then((r) => {
        if (r.success && r.data) setRecommendations(r.data.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoadingRec(false));
  }, []);

  const chartData = assets.filter((a) => a.balance > 0);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl flex flex-col gap-0 overflow-hidden"
      style={{ height: "clamp(420px, 60vh, 520px)" }}
    >
      {/* ── Pie Chart ── */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" /> Asset Allocation
        </h2>

        {isLoading ? (
          <div className="h-36 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-10">No assets in treasury wallet.</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={52}
                    paddingAngle={3}
                    dataKey="percentage"
                    nameKey="unitName"
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {chartData.map((a, i) => (
                <div key={a.assetId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 truncate">{a.unitName}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-800">{a.percentage.toFixed(1)}%</span>
                    <p className="text-xs text-gray-400 leading-none">{a.balance.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 mx-4" />

      {/* ── Quick Actions ── */}
      <div className="px-5 py-3 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map(({ label, icon: Icon, color, bg, hint }) => (
            <button
              key={label}
              onClick={() => onQuickAction?.(hint)}
              title={hint}
              className={`flex items-center gap-2 px-3 py-2.5 ${bg} rounded-lg hover:opacity-80 transition-opacity text-left`}
            >
              <Icon className={`h-3.5 w-3.5 ${color} flex-shrink-0`} />
              <span className={`text-xs font-medium ${color}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 mx-4" />

      {/* ── AI Insights ── */}
      <div className="px-5 py-3 flex-1 overflow-y-auto min-h-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> AI Insights
        </p>

        {loadingRec ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-400 mb-2" />
            <p className="text-xs text-gray-400">Treasury looks healthy — no alerts right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.map((rec, i) => {
              const style = SEVERITY_STYLES[rec.severity] ?? SEVERITY_STYLES.info;
              const Icon = style.icon;
              return (
                <div key={i} className={`${style.bg} ${style.border} border rounded-lg px-3 py-2.5`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`h-3.5 w-3.5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 leading-snug">{rec.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{rec.recommendation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetAllocationChart;
