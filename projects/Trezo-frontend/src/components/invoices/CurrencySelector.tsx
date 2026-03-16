import React from "react";
import { AssetHolding } from "../../services/api";
import { AlertTriangle } from "lucide-react";

interface Props {
  assets: AssetHolding[];
  selected: { currency: string; assetId: number | null };
  onChange: (currency: string, assetId: number | null) => void;
  receiverOptedIn?: boolean;
}

const CurrencySelector: React.FC<Props> = ({ assets, selected, onChange, receiverOptedIn }) => {
  const options = [
    { currency: "ALGO", assetId: null, label: "ALGO", balance: null as number | null },
    ...assets
      .filter((a) => a.amount > 0)
      .map((a) => ({
        currency: a.unitName || `ASA-${a.assetId}`,
        assetId: a.assetId,
        label: `${a.name || a.unitName} (${a.unitName}) — ID: ${a.assetId}`,
        balance: a.amount,
      })),
  ];

  return (
    <div className="space-y-2">
      <select
        value={selected.assetId === null ? "ALGO" : String(selected.assetId)}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "ALGO") {
            onChange("ALGO", null);
            return;
          }
          const opt = options.find((o) => String(o.assetId) === val);
          if (opt) onChange(opt.currency, opt.assetId);
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.assetId ?? "ALGO"} value={o.assetId === null ? "ALGO" : String(o.assetId)}>
            {o.label}
            {o.balance !== null ? ` — Balance: ${o.balance}` : ""}
          </option>
        ))}
      </select>
      {selected.assetId !== null && receiverOptedIn === false && (
        <div className="flex items-center gap-2 text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Recipient has not opted into this asset. Payment may fail.
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
