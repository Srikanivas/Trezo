import React, { useState } from "react";
import { WalletApiService, ApiWalletInfo } from "../services/walletApiService";
import { getAddressUrl, getDispenserUrl, NETWORK_INFO } from "../config/explorer";

interface CreateWalletProps {
  openModal: boolean;
  closeModal: () => void;
}

const CreateWallet: React.FC<CreateWalletProps> = ({ openModal, closeModal }) => {
  const [walletInfo, setWalletInfo] = useState<ApiWalletInfo | null>(null);
  const [mnemonicInput, setMnemonicInput] = useState<string>("");
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleCreateWallet = async () => {
    setLoading(true);
    setError("");

    try {
      const newWallet = await WalletApiService.createWallet();
      setWalletInfo(newWallet);
      setMnemonicInput("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverWallet = async () => {
    if (!mnemonicInput.trim()) {
      setError("Please enter a mnemonic phrase");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const recovered = await WalletApiService.recoverWallet(mnemonicInput.trim());
      setWalletInfo({
        address: recovered.address,
        mnemonic: mnemonicInput.trim(),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to recover wallet");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (error) {
      alert("Failed to copy to clipboard");
    }
  };
  const handleClose = () => {
    setWalletInfo(null);
    setMnemonicInput("");
    setShowMnemonic(false);
    setError("");
    setLoading(false);
    closeModal();
  };

  return (
    <dialog id="create_wallet_modal" className={`modal ${openModal ? "modal-open" : ""}`}>
      <div className="modal-box">
        <h3 className="modal-title">💼 Create or Recover Wallet</h3>

        {error && <div className="status-message status-error">{error}</div>}

        <div className="btn-grid">
          {!walletInfo ? (
            <>
              <div className="form-group">
                <button
                  type="button"
                  className={`btn btn-primary w-full ${loading ? "btn-disabled" : ""}`}
                  onClick={handleCreateWallet}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading">
                      <span className="loading-spinner" />
                      Creating Wallet...
                    </span>
                  ) : (
                    <>
                      <span className="emoji">✨</span>
                      Create New Wallet
                    </>
                  )}
                </button>
              </div>

              <div className="divider" />

              <div className="form-group">
                <label className="form-label">Recover from Mnemonic (25 words):</label>
                <textarea
                  className="input input-bordered"
                  placeholder="Enter your 25-word mnemonic phrase..."
                  value={mnemonicInput}
                  onChange={(e) => setMnemonicInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className={`btn btn-secondary w-full mt-4 ${loading || !mnemonicInput.trim() ? "btn-disabled" : ""}`}
                  onClick={handleRecoverWallet}
                  disabled={loading || !mnemonicInput.trim()}
                >
                  {loading ? (
                    <span className="loading">
                      <span className="loading-spinner" />
                      Recovering...
                    </span>
                  ) : (
                    <>
                      <span className="emoji">🔄</span>
                      Recover Wallet
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="btn-grid">
              <div className="form-group">
                <label className="form-label">Address:</label>
                <div className="flex gap-2">
                  <input type="text" className="input input-bordered flex-1 text-sm font-mono" value={walletInfo.address} readOnly />
                  <button type="button" className="btn btn-accent" onClick={() => copyToClipboard(walletInfo.address)}>
                    📋
                  </button>
                </div>
              </div>

              <div className="form-group">
                <div className="flex items-center gap-2 mb-2">
                  <label className="form-label mb-0">Mnemonic Phrase:</label>
                  <button type="button" className="btn btn-accent" onClick={() => setShowMnemonic(!showMnemonic)}>
                    {showMnemonic ? "👁️‍🗨️ Hide" : "👁️ Show"}
                  </button>
                </div>
                {showMnemonic && (
                  <div className="flex gap-2">
                    <textarea className="input input-bordered flex-1 text-sm font-mono" value={walletInfo.mnemonic} readOnly />
                    <button type="button" className="btn btn-accent" onClick={() => copyToClipboard(walletInfo.mnemonic)}>
                      📋
                    </button>
                  </div>
                )}
              </div>

              <div className="status-message status-warning">
                <strong>⚠️ Important:</strong> Save your mnemonic phrase securely!
              </div>

              <div className="status-message status-success">
                <strong>✅ {NETWORK_INFO.name} Wallet Created!</strong> This wallet is created on {NETWORK_INFO.description}.
              </div>

              <div className="status-message status-info">
                <strong>💰 Get Test Funds:</strong> Visit the{" "}
                <a href={getDispenserUrl()} target="_blank" rel="noopener noreferrer">
                  {NETWORK_INFO.name} Dispenser
                </a>{" "}
                to get free test ALGO tokens.
              </div>

              <div className="status-message status-info">
                <strong>🔍 View on {NETWORK_INFO.explorerName}:</strong>{" "}
                <a href={getAddressUrl(walletInfo.address)} target="_blank" rel="noopener noreferrer">
                  Check your address on {NETWORK_INFO.explorerName}
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-accent" onClick={handleClose} disabled={loading}>
            Close
          </button>
          {walletInfo && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setWalletInfo(null);
                setError("");
              }}
              disabled={loading}
            >
              <span className="emoji">➕</span>
              Create Another
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
};

export default CreateWallet;
