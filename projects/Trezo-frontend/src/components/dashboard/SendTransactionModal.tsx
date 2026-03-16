import React, { useState } from "react";
import { TreasuryBalance, treasuryAPI } from "../../services/api";
import { X, Send, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";

interface SendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  balance: TreasuryBalance | null;
}

const SendTransactionModal: React.FC<SendTransactionModalProps> = ({ isOpen, onClose, onSuccess, balance }) => {
  const [formData, setFormData] = useState({
    receiverAddress: "",
    amount: "",
    assetId: "0", // 0 for ALGO
    note: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    transactionId: string;
    explorerUrl: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(null);

    try {
      const amount = parseFloat(formData.amount);
      const assetId = parseInt(formData.assetId);

      // Validate amount
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount");
        setIsLoading(false);
        return;
      }

      // Check balance
      if (assetId === 0 && balance) {
        if (amount > balance.algoBalance) {
          setError("Insufficient ALGO balance");
          setIsLoading(false);
          return;
        }
      } else if (assetId > 0 && balance) {
        const asset = balance.assets.find((a) => a.assetId === assetId);
        if (!asset) {
          setError("Asset not found in wallet");
          setIsLoading(false);
          return;
        }
        if (amount > asset.amount) {
          setError("Insufficient asset balance");
          setIsLoading(false);
          return;
        }
      }

      const response = await treasuryAPI.sendTransaction({
        receiverAddress: formData.receiverAddress,
        amount,
        assetId: assetId === 0 ? undefined : assetId,
        note: formData.note || undefined,
      });

      if (response.success && response.data) {
        setSuccess(response.data);
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setError(response.error || "Transaction failed");
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      setError(error.response?.data?.error || "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getMaxAmount = (): number => {
    if (!balance) return 0;

    const assetId = parseInt(formData.assetId);
    if (assetId === 0) {
      // Reserve some ALGO for transaction fees
      return Math.max(0, balance.algoBalance - 0.001);
    } else {
      const asset = balance.assets.find((a) => a.assetId === assetId);
      return asset ? asset.amount : 0;
    }
  };

  const setMaxAmount = () => {
    const maxAmount = getMaxAmount();
    setFormData({
      ...formData,
      amount: maxAmount.toString(),
    });
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction Sent Successfully!</h3>
            <p className="text-sm text-gray-600 mb-4">Your transaction has been submitted to the Algorand network.</p>
            <div className="bg-gray-50 rounded-md p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Transaction ID:</p>
              <p className="font-mono text-sm text-gray-900 break-all">{success.transactionId}</p>
            </div>
            <div className="flex space-x-3">
              <a
                href={success.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </a>
              <button
                onClick={onClose}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Send Payment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="receiverAddress" className="block text-sm font-medium text-gray-700">
              Recipient Address
            </label>
            <input
              type="text"
              id="receiverAddress"
              name="receiverAddress"
              required
              value={formData.receiverAddress}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter Algorand address"
            />
          </div>

          <div>
            <label htmlFor="assetId" className="block text-sm font-medium text-gray-700">
              Asset
            </label>
            <select
              id="assetId"
              name="assetId"
              value={formData.assetId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="0">ALGO</option>
              {balance?.assets.map((asset) => (
                <option key={asset.assetId} value={asset.assetId}>
                  {asset.name || `Asset ${asset.assetId}`} ({asset.unitName || "Unknown"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <button type="button" onClick={setMaxAmount} className="text-xs text-indigo-600 hover:text-indigo-500">
                Max: {getMaxAmount().toLocaleString()}
              </button>
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              required
              step="any"
              min="0"
              value={formData.amount}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
              Note (Optional)
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              value={formData.note}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Add a note to this transaction"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendTransactionModal;
