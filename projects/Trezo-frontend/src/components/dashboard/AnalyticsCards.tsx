import React from "react";
import { TreasuryAnalytics } from "../../services/api";
import { TrendingUp, TrendingDown, FileText, Zap } from "lucide-react";

interface Props {
  analytics: TreasuryAnalytics | null;
  isLoading: boolean;
}

const fmt = (val: number) =>
  val >= 1_000_000 ? `${(val / 1_000_000).toFixed(2)}M` : val >= 1_000 ? `${(val / 1_000).toFixed(2)}K` : val.toFixed(4);

const cards = (a: TreasuryAnalytics) => [
  {
    label: "Treasury Value",
    value: `${fmt(a.treasuryValue)} ALGO`,
    icon: Zap,
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
  },
  {
    label: "Pending Invoices",
    value: `${fmt(a.pendingInvoices)}`,
    icon: FileText,
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
  },
  {
    label: "Monthly Revenue",
    value: `${fmt(a.monthlyRevenue)}`,
    icon: TrendingUp,
    color: "bg-green-50 text-green-600",
    border: "border-green-100",
  },
  {
    label: "Monthly Payments",
    value: `${fmt(a.monthlyPayments)} ALGO`,
    icon: TrendingDown,
    color: "bg-rose-50 text-rose-600",
    border: "border-rose-100",
  },
];

const AnalyticsCards: React.FC<Props> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards(analytics).map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`bg-white rounded-xl shadow p-4 border ${card.border}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <div className={`p-1.5 rounded-lg ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 truncate">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsCards;
