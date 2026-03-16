import React, { useState } from "react";
import { paymentAPI } from "../../services/api";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onSuccess: () => void;
}

const ASSET_TYPES = ["ALGO", "USDC", "USDT", "Other"];

const PaymentForm: React.FC<Props> = ({ onSuccess }) => {
  const [form, setForm] = useState({
    receiver_address: "",
    amount: "",
    asset_type: "ALGO",
    asset_id: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.receiver_address || !form.amount) {
      setError("Receiver address and amount are required.");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        receiver_address: form.receiver_address.trim(),
        amount: parseFloat(form.amount),
        asset_type: form.asset_type,
        description: form.description || undefined,
      };
      if (form.asset_id) payload.asset_id = parseInt(form.asset_id);

      const res = await paymentAPI.send(payload);
      if (!res.success) throw new Error(res.error || "Payment failed");
      setSuccess(`Payment confirmed! Tx: ${res.data?.transaction_hash}`);
      setForm({ receiver_address: "", amount: "", asset_type: "ALGO", asset_id: "", description: "" });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Send Supplier Payment</h2>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 break-all">{success}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Receiver Address *</label>
        <input
          name="receiver_address"
          value={form.receiver_address}
          onChange={handleChange}
          placeholder="ALGO address..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
          <input
            name="amount"
            type="number"
            min="0"
            step="any"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Asset Type *</label>
          <select
            name="asset_type"
            value={form.asset_type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ASSET_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {form.asset_type !== "ALGO" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Asset ID (ASA)</label>
          <input
            name="asset_id"
            type="number"
            value={form.asset_id}
            onChange={handleChange}
            placeholder="e.g. 10458941 for USDC"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          placeholder="Supplier payment for..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Sending..." : "Send Payment"}
      </button>
    </form>
  );
};

export default PaymentForm;
