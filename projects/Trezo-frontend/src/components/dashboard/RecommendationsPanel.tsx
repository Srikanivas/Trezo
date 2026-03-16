import React from "react";
import { Recommendation } from "../../services/api";
import { Lightbulb, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface Props {
  recommendations: Recommendation[];
  isLoading: boolean;
}

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-50 border-amber-200 text-amber-800",
    iconClass: "text-amber-500",
  },
  info: {
    icon: Info,
    className: "bg-blue-50 border-blue-200 text-blue-800",
    iconClass: "text-blue-500",
  },
  success: {
    icon: CheckCircle,
    className: "bg-green-50 border-green-200 text-green-800",
    iconClass: "text-green-500",
  },
};

const RecommendationsPanel: React.FC<Props> = ({ recommendations, isLoading }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-gray-800">AI Recommendations</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">No recommendations available.</p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const cfg = typeConfig[rec.type];
            const Icon = cfg.icon;
            return (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.className}`}>
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.iconClass}`} />
                <p className="text-sm leading-relaxed">{rec.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPanel;
