import React from "react";
import { TreasuryBalance } from "../../services/api";
import { Coins, TrendingUp, Wallet } from "lucide-react";
import { NETWORK_INFO } from "../../config/explorer";

interface BalanceCardProps {
  balance: TreasuryBalance | null;
  isLoading: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Unable to load balance information</p>
        </div>
      </div>
    );
  }

  const formatAlgoAmount = (amount: number): string => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatAssetAmount = (amount: number, decimals: number): string => {
    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ALGO Balance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Coins className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">ALGO Balance</p>
            <p className="text-2xl font-semibold text-gray-900">{formatAlgoAmount(balance.algoBalance)}</p>
            <p className="text-xs text-gray-500">Algorand</p>
          </div>
        </div>
      </div>

      {/* Asset Count */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Assets Held</p>
            <p className="text-2xl font-semibold text-gray-900">{balance.assets.length}</p>
            <p className="text-xs text-gray-500">Different tokens</p>
          </div>
        </div>
      </div>

      {/* Total Value (placeholder) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Network</p>
            <p className="text-2xl font-semibold text-gray-900">{NETWORK_INFO.name}</p>
            <p className="text-xs text-gray-500">{NETWORK_INFO.description}</p>
          </div>
        </div>
      </div>

      {/* Asset Holdings */}
      {balance.assets.length > 0 && (
        <div className="md:col-span-3 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Holdings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {balance.assets.map((asset) => (
              <div key={asset.assetId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{asset.name || `Asset ${asset.assetId}`}</p>
                    <p className="text-sm text-gray-500">{asset.unitName || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatAssetAmount(asset.amount, asset.decimals)}</p>
                    <p className="text-xs text-gray-500">ID: {asset.assetId}</p>
                  </div>
                </div>
                {asset.url && (
                  <div className="mt-2">
                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500">
                      View Details
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceCard;
