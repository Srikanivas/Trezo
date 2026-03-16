// This component is superseded by src/components/invoices/InvoicePage.tsx
// Kept as a stub to avoid breaking any remaining imports.
import React from "react";
import { FileText } from "lucide-react";

interface Props {
  onOpenInvoices?: () => void;
}

const InvoiceList: React.FC<Props> = ({ onOpenInvoices }) => (
  <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]">
    <FileText className="h-8 w-8 text-indigo-400" />
    <p className="text-sm text-gray-500">Invoice management has moved to the Invoice Center.</p>
    {onOpenInvoices && (
      <button onClick={onOpenInvoices} className="text-sm text-indigo-600 hover:underline">
        Open Invoice Center
      </button>
    )}
  </div>
);

export default InvoiceList;
