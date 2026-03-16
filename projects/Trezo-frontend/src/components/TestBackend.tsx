import React, { useState } from "react";
import { WalletApiService } from "../services/walletApiService";

interface TestBackendProps {
  openModal: boolean;
  closeModal: () => void;
}

const TestBackend: React.FC<TestBackendProps> = ({ openModal, closeModal }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const testConnection = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      // Simple test - try to create a wallet to test backend connection
      const response = await WalletApiService.createWallet();
      setResult(JSON.stringify({ message: "Backend connection successful", address: response.address }, null, 2));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult("");
    setError("");
    setLoading(false);
    closeModal();
  };

  return (
    <dialog id="test_backend_modal" className={`modal ${openModal ? "modal-open" : ""}`}>
      <div className="modal-box">
        <h3 className="modal-title">🧪 Test Backend Connection</h3>

        {error && <div className="status-message status-error">{error}</div>}

        <div className="form-group">
          <button
            type="button"
            className={`btn btn-primary w-full ${loading ? "btn-disabled" : ""}`}
            onClick={testConnection}
            disabled={loading}
          >
            {loading ? (
              <span className="loading">
                <span className="loading-spinner" />
                Testing...
              </span>
            ) : (
              <>
                <span className="emoji">🔍</span>
                Test Connection
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="form-group">
            <label className="form-label">Response:</label>
            <textarea className="input input-bordered font-mono text-sm" value={result} readOnly rows={8} />
          </div>
        )}

        <div className="modal-action">
          <button type="button" className="btn btn-accent" onClick={handleClose} disabled={loading}>
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default TestBackend;
