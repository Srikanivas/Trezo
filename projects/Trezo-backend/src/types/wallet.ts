export interface WalletInfo {
  address: string;
  mnemonic: string;
  secretKey: Uint8Array;
}

export interface CreateWalletResponse {
  success: boolean;
  data?: {
    address: string;
    mnemonic: string;
  };
  error?: string;
}

export interface RecoverWalletRequest {
  mnemonic: string;
}

export interface RecoverWalletResponse {
  success: boolean;
  data?: {
    address: string;
    isValid: boolean;
  };
  error?: string;
}

export interface WalletValidationResult {
  isValid: boolean;
  address?: string;
  error?: string;
}
// Treasury system types
export interface CompanyRegistration {
  companyName: string;
  email: string;
  password: string;
}

export interface CompanyLogin {
  email: string;
  password: string;
}

export interface TreasuryBalance {
  address: string;
  algoBalance: number;
  assets: AssetHolding[];
  totalValueUSD?: number;
}

export interface AssetHolding {
  assetId: number;
  amount: number;
  decimals: number;
  name?: string;
  unitName?: string;
  url?: string;
}

export interface SendTransactionRequest {
  receiverAddress: string;
  amount: number;
  assetId?: number;
  note?: string;
}

export interface TransactionResponse {
  success: boolean;
  data?: {
    transactionId: string;
    explorerUrl: string;
  };
  error?: string;
}

export interface AuditLogEntry {
  id: number;
  company_id: number;
  operation_type: string;
  wallet_address: string;
  transaction_id?: string;
  amount?: number;
  asset_id?: number;
  recipient_address?: string;
  details?: any;
  created_at: Date;
}
