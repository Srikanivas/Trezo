import { useWallet } from "@txnlab/use-wallet-react";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { getAlgodConfigFromViteEnvironment } from "../utils/network/getAlgoClientConfigs";
import { AlgorandClient, microAlgos } from "@algorandfoundation/algokit-utils";

interface TransactInterface {
  openModal: boolean;
  setModalState: (value: boolean) => void;
}

const Transact = ({ openModal, setModalState }: TransactInterface) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [receiverAddress, setReceiverAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();
  const { transactionSigner, activeAddress } = useWallet();

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
  });
  algorand.setDefaultSigner(transactionSigner);

  const sendTransaction = async () => {
    if (!receiverAddress || !amount) {
      enqueueSnackbar("Please fill in all fields", { variant: "error" });
      return;
    }

    setLoading(true);

    try {
      const amountInMicroAlgos = microAlgos(parseFloat(amount) * 1000000);

      const result = await algorand.send.payment({
        sender: activeAddress!,
        receiver: receiverAddress,
        amount: amountInMicroAlgos,
      });

      enqueueSnackbar(`Transaction sent! ID: ${result.txIds[0]}`, { variant: "success" });
      setReceiverAddress("");
      setAmount("");
    } catch (error) {
      enqueueSnackbar(`Error: ${error instanceof Error ? error.message : "Transaction failed"}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog id="transact_modal" className={`modal ${openModal ? "modal-open" : ""}`}>
      <div className="modal-box">
        <h3 className="modal-title">💸 Send Transaction</h3>
        <p className="app-subtitle text-center mb-4">Send ALGO to another address</p>

        <div className="form-group">
          <label className="form-label">Receiver Address</label>
          <input
            type="text"
            placeholder="Enter receiver's address..."
            className="input input-bordered"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Amount (ALGO)</label>
          <input
            type="number"
            step="0.000001"
            placeholder="Enter amount..."
            className="input input-bordered"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="modal-action">
          <button className="btn btn-accent" onClick={() => setModalState(!openModal)}>
            Cancel
          </button>
          <button className={`btn btn-primary`} onClick={sendTransaction} disabled={loading}>
            {loading ? (
              <span className="loading">
                <span className="loading-spinner" />
                Sending...
              </span>
            ) : (
              <>
                <span className="emoji">📤</span>
                Send Transaction
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default Transact;
