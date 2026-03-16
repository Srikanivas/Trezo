import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  overage: string;
  currency: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const BudgetWarningModal: React.FC<Props> = ({ overage, currency, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-amber-100 p-2 rounded-full">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900">Budget Limit Exceeded</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        This payment will exceed your budget by{" "}
        <span className="font-semibold text-amber-700">
          {overage} {currency}
        </span>
        . Do you want to proceed anyway?
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700">
          Confirm Payment
        </button>
      </div>
    </div>
  </div>
);

export default BudgetWarningModal;
