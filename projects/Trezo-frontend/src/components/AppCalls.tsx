import { useWallet } from "@txnlab/use-wallet-react";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { HelloWorldFactory } from "../contracts/HelloWorld";
import { OnSchemaBreak, OnUpdate } from "@algorandfoundation/algokit-utils/types/app";
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from "../utils/network/getAlgoClientConfigs";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";

interface AppCallsInterface {
  openModal: boolean;
  setModalState: (value: boolean) => void;
}

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [contractInput, setContractInput] = useState<string>("");
  const { enqueueSnackbar } = useSnackbar();
  const { transactionSigner, activeAddress } = useWallet();

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const indexerConfig = getIndexerConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({
    algodConfig,
    indexerConfig,
  });
  algorand.setDefaultSigner(transactionSigner);

  const sendAppCall = async () => {
    setLoading(true);

    // Please note, in typical production scenarios,
    // you wouldn't want to use deploy directly from your frontend.
    // Instead, you would deploy your contract on your backend and reference it by id.
    // Given the simplicity of the starter contract, we are deploying it on the frontend
    // for demonstration purposes.
    const factory = new HelloWorldFactory({
      defaultSender: activeAddress ?? undefined,
      algorand,
    });
    const deployResult = await factory
      .deploy({
        onSchemaBreak: OnSchemaBreak.AppendApp,
        onUpdate: OnUpdate.AppendApp,
      })
      .catch((e: Error) => {
        enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: "error" });
        setLoading(false);
        return undefined;
      });

    if (!deployResult) {
      return;
    }

    const { appClient } = deployResult;

    const response = await appClient.send.hello({ args: { name: contractInput } }).catch((e: Error) => {
      enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: "error" });
      setLoading(false);
      return undefined;
    });

    if (!response) {
      return;
    }

    enqueueSnackbar(`Response from the contract: ${response.return}`, { variant: "success" });
    setLoading(false);
  };

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? "modal-open" : ""}`}>
      <div className="modal-box">
        <h3 className="modal-title">🤝 Smart Contract Interaction</h3>
        <p className="app-subtitle text-center mb-4">Send a greeting to your Algorand smart contract</p>

        <div className="form-group">
          <label className="form-label">Your Message</label>
          <input
            type="text"
            placeholder="Enter your name or message..."
            className="input input-bordered"
            value={contractInput}
            onChange={(e) => {
              setContractInput(e.target.value);
            }}
          />
        </div>

        <div className="modal-action">
          <button className="btn btn-accent" onClick={() => setModalState(!openModal)}>
            Cancel
          </button>
          <button className={`btn btn-primary`} onClick={sendAppCall} disabled={loading}>
            {loading ? (
              <span className="loading">
                <span className="loading-spinner" />
                Sending...
              </span>
            ) : (
              <>
                <span className="emoji">📤</span>
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default AppCalls;
