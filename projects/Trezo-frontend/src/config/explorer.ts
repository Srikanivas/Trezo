// Explorer configuration for different networks and providers
export interface ExplorerConfig {
  name: string;
  baseUrl: string;
  addressPath: string;
  transactionPath: string;
  assetPath: string;
  dispenserUrl?: string;
}

// Available explorer providers
export const EXPLORERS = {
  LORA: {
    name: "Lora Explorer",
    baseUrl: "https://lora.algokit.io",
    addressPath: "/testnet/account",
    transactionPath: "/testnet/transaction",
    assetPath: "/testnet/asset",
    dispenserUrl: "https://lora.algokit.io/testnet/dispenser", // Updated to use Lora explorer
  },
  ALGOEXPLORER: {
    name: "AlgoExplorer",
    baseUrl: "https://lora.algokit.io/testnet",
    addressPath: "/address",
    transactionPath: "/tx",
    assetPath: "/asset",
    dispenserUrl: "https://lora.algokit.io/testnet/dispenser",
  },
  ALLO: {
    name: "Allo Explorer",
    baseUrl: "https://allo.info",
    addressPath: "/account",
    transactionPath: "/tx",
    assetPath: "/asset",
    dispenserUrl: "https://lora.algokit.io/testnet/dispenser",
  },
} as const;

// Current explorer configuration - change this to switch explorers
// To use Lora Explorer: export const CURRENT_EXPLORER: ExplorerConfig = EXPLORERS.LORA;
// To use AlgoExplorer: export const CURRENT_EXPLORER: ExplorerConfig = EXPLORERS.ALGOEXPLORER;
// To use Allo Explorer: export const CURRENT_EXPLORER: ExplorerConfig = EXPLORERS.ALLO;
export const CURRENT_EXPLORER: ExplorerConfig = EXPLORERS.ALGOEXPLORER;

// Helper functions to generate explorer URLs
export const getAddressUrl = (address: string): string => {
  return `${CURRENT_EXPLORER.baseUrl}${CURRENT_EXPLORER.addressPath}/${address}`;
};

export const getTransactionUrl = (txId: string): string => {
  return `${CURRENT_EXPLORER.baseUrl}${CURRENT_EXPLORER.transactionPath}/${txId}`;
};

export const getAssetUrl = (assetId: number): string => {
  return `${CURRENT_EXPLORER.baseUrl}${CURRENT_EXPLORER.assetPath}/${assetId}`;
};

export const getDispenserUrl = (): string => {
  return CURRENT_EXPLORER.dispenserUrl || EXPLORERS.ALGOEXPLORER.dispenserUrl!;
};

// Network information
export const NETWORK_INFO = {
  name: "TestNet",
  description: "Algorand TestNet",
  explorerName: CURRENT_EXPLORER.name,
};
