import React from "react";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { getTransactionUrl } from "../../config/explorer";

interface Transaction {
  id: string;
  sender: string;
  receiver?: string;
  amount: number;
  type: string;
  timestamp: number;
  fee: number;
}

interface Props {
  transactions: Transaction[];
  walletAddress: string;
  isLoading: boolean;
}

const RecentTransactionsCard: React.FC<Props> = ({ transactions, walletAddress, isLoading }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No transactions found.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {transactions.map((tx) => {
            const isOutgoing = tx.sender === walletAddress;
            const amountAlgo = tx.amount; // already converted to ALGO by backend
            const date = tx.timestamp ? format(new Date(tx.timestamp * 1000), "MMM d, HH:mm") : "—";

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${isOutgoing ? "bg-rose-100" : "bg-green-100"}`}>
                    {isOutgoing ? <ArrowUpRight className="h-4 w-4 text-rose-600" /> : <ArrowDownLeft className="h-4 w-4 text-green-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{isOutgoing ? "Sent" : "Received"}</p>
                    <p className="text-xs text-gray-400 font-mono">{tx.id.slice(0, 12)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isOutgoing ? "text-rose-600" : "text-green-600"}`}>
                      {isOutgoing ? "-" : "+"}
                      {amountAlgo.toFixed(4)} ALGO
                    </p>
                    <p className="text-xs text-gray-400">{date}</p>
                  </div>
                  <a
                    href={getTransactionUrl(tx.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-indigo-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentTransactionsCard;
