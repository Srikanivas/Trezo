import React from "react";
import { TransactionHistory } from "../../services/api";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import { getTransactionUrl } from "../../config/explorer";

interface TransactionListProps {
  transactions: TransactionHistory | null;
  isLoading: boolean;
  walletAddress: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, isLoading, walletAddress }) => {
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.transactions.length === 0) {
    return (
      <div className="p-6 text-center">
        <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No transactions found</p>
        <p className="text-sm text-gray-400 mt-2">Transactions will appear here once you start using your treasury wallet</p>
      </div>
    );
  }

  const formatAmount = (amount: number, assetId?: number): string => {
    if (!assetId || assetId === 0) {
      // ALGO amount (convert from microAlgos)
      return (amount / 1000000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
    } else {
      // Asset amount (already in correct units from API)
      return amount.toLocaleString("en-US");
    }
  };

  const getTransactionType = (tx: any): "sent" | "received" => {
    return tx.sender === walletAddress ? "sent" : "received";
  };

  const getOtherAddress = (tx: any): string => {
    const type = getTransactionType(tx);
    return type === "sent" ? tx.receiver || "Unknown" : tx.sender;
  };

  const truncateAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const openTransactionExplorer = (txId: string) => {
    window.open(getTransactionUrl(txId), "_blank");
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        {transactions.transactions.map((tx) => {
          const type = getTransactionType(tx);
          const otherAddress = getOtherAddress(tx);
          const isAlgo = !tx.assetId || tx.assetId === 0;

          return (
            <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    type === "sent" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                  }`}
                >
                  {type === "sent" ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {type === "sent" ? "Sent" : "Received"} {isAlgo ? "ALGO" : "Asset"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {type === "sent" ? "To" : "From"}: {truncateAddress(otherAddress)}
                  </p>
                  <p className="text-xs text-gray-400">{format(new Date(tx.timestamp * 1000), "MMM dd, yyyy HH:mm")}</p>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-semibold ${type === "sent" ? "text-red-600" : "text-green-600"}`}>
                  {type === "sent" ? "-" : "+"}
                  {formatAmount(tx.amount, tx.assetId)} {isAlgo ? "ALGO" : ""}
                </p>
                {!isAlgo && <p className="text-xs text-gray-500">Asset ID: {tx.assetId}</p>}
                <p className="text-xs text-gray-400">Fee: {(tx.fee / 1000000).toFixed(6)} ALGO</p>
                <button
                  onClick={() => openTransactionExplorer(tx.id)}
                  className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-500 mt-1"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {transactions.nextToken && (
        <div className="mt-6 text-center">
          <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">Load more transactions</button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
