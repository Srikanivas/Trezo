import React, { useState, useEffect, useCallback } from "react";
import { invoiceAPI, Invoice, InvoiceStatus, InvoiceInboxFilters } from "../../services/api";
import InvoiceCard from "./InvoiceCard";
import InvoiceDetailModal from "./InvoiceDetailModal";
import { Filter } from "lucide-react";

interface Props {
  currentCompanyId: number;
  onRefresh?: () => void;
}

const STATUSES: InvoiceStatus[] = ["pending_approval", "approved", "paid", "rejected", "cancelled"];

const InvoiceInbox: React.FC<Props> = ({ currentCompanyId, onRefresh }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [filters, setFilters] = useState<InvoiceInboxFilters>({});

  const load = useCallback(async () => {
    try {
      const res = await invoiceAPI.getInbox(filters);
      if (res.success && res.data) setInvoices(res.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll every 10s
  useEffect(() => {
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  function handleRefresh() {
    load();
    onRefresh?.();
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filters.direction ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, direction: (e.target.value as any) || undefined }))}
          className="text-xs border border-gray-200 rounded px-2 py-1"
        >
          <option value="">All</option>
          <option value="sent">Sent</option>
          <option value="received">Received</option>
        </select>
        <select
          value={filters.status ?? ""}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as any) || undefined }))}
          className="text-xs border border-gray-200 rounded px-2 py-1"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No invoices found</div>
        ) : (
          invoices.map((inv) => (
            <InvoiceCard key={inv.id} invoice={inv} currentCompanyId={currentCompanyId} onClick={() => setSelected(inv)} />
          ))
        )}
      </div>

      {selected && (
        <InvoiceDetailModal
          invoice={selected}
          currentCompanyId={currentCompanyId}
          onClose={() => setSelected(null)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default InvoiceInbox;
