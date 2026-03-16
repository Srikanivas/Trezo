const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api/v1";

export interface ApiWalletInfo {
  address: string;
  mnemonic: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface WalletValidationResult {
  isValid: boolean;
  address?: string;
  error?: string;
}

export class WalletApiService {
  /**
   * Creates a new wallet via backend API
   */
  static async createWallet(): Promise<ApiWalletInfo> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<ApiWalletInfo> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create wallet");
      }

      return result.data;
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw new Error("Failed to create wallet. Please check your connection and try again.");
    }
  }

  /**
   * Recovers a wallet from mnemonic via backend API
   */
  static async recoverWallet(mnemonic: string): Promise<{ address: string; isValid: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/recover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mnemonic: mnemonic.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ address: string; isValid: boolean }> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to recover wallet");
      }

      return result.data;
    } catch (error) {
      console.error("Error recovering wallet:", error);
      throw new Error("Invalid mnemonic phrase or connection error");
    }
  }

  /**
   * Validates a mnemonic phrase via backend API
   */
  static async validateMnemonic(mnemonic: string): Promise<WalletValidationResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mnemonic: mnemonic.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<WalletValidationResult> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to validate mnemonic");
      }

      return result.data;
    } catch (error) {
      console.error("Error validating mnemonic:", error);
      return {
        isValid: false,
        error: "Connection error or invalid mnemonic",
      };
    }
  }

  /**
   * Gets account information for an address
   */
  static async getAccountInfo(address: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/account/${address}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to get account info");
      }

      return result.data;
    } catch (error) {
      console.error("Error getting account info:", error);
      throw new Error("Failed to get account information");
    }
  }

  /**
   * Health check for backend API
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
      });

      return response.ok;
    } catch (error) {
      console.error("Backend health check failed:", error);
      return false;
    }
  }
}
