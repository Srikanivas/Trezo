import React, { useState, useEffect } from "react";
import { budgetAPI, Budget } from "../../services/api";
import { Plus, Trash2, Edit2, X, Check } from "lucide-react";

const BudgetPanel: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", currency: "ALGO", limit_amount: "", period: "monthly" as "monthly" | "quarterly" });
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await budgetAPI.list();
      if (res.success && res.data) setBudgets(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    if (!form.name || !form.limit_amount) {
      setError("Name and limit are required");
      return;
    }
    setError("");
    try {
      if (editId) {
        await budgetAPI.update(editId, form);
      } else {
        await budgetAPI.create({ ...form });
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", currency: "ALGO", limit_amount: "", period: "monthly" });
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to save budget");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this budget?")) return;
    await budgetAPI.delete(id);
    load();
  }

  function startEdit(b: Budget) {
    setEditId(b.id);
    setForm({ name: b.name, currency: b.currency, limit_amount: b.limit_amount, period: b.period });
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Spending Budgets</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm({ name: "", currency: "ALGO", limit_amount: "", period: "monthly" });
          }}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
        >
          <Plus className="h-3.5 w-3.5" /> New Budget
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Currency</label>
              <input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Limit</label>
              <input
                type="number"
                value={form.limit_amount}
                onChange={(e) => setForm((f) => ({ ...f, limit_amount: e.target.value }))}
                className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Period</label>
              <select
                value={form.period}
                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value as any }))}
                className="w-full mt-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-100"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
            >
              <Check className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : budgets.length === 0 ? (
        <p className="text-sm text-gray-400">No budgets yet. Create one to track spending.</p>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const consumed = parseFloat(b.consumed_amount);
            const limit = parseFloat(b.limit_amount);
            const pct = limit > 0 ? Math.min((consumed / limit) * 100, 100) : 0;
            const barColor = pct >= 80 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-green-500";
            return (
              <div key={b.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.name}</p>
                    <p className="text-xs text-gray-400">
                      {b.period} · {b.currency}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(b)} className="p-1 text-gray-400 hover:text-indigo-600">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                  <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{consumed.toFixed(2)} used</span>
                  <span>
                    {(limit - consumed).toFixed(2)} remaining of {b.limit_amount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetPanel;
