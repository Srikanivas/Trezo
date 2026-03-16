import { useWallet } from "@txnlab/use-wallet-react";
import { ellipseAddress } from "../utils/ellipseAddress";

const Account = () => {
  const { activeAddress, activeAccount } = useWallet();

  if (!activeAddress) {
    return null;
  }

  return (
    <div className="card card-compact">
      <div className="text-center">
        <h4 className="font-semibold mb-2">Connected Account</h4>
        <p className="text-sm font-mono opacity-70">{ellipseAddress(activeAddress)}</p>
        {activeAccount && <p className="text-xs opacity-70 mt-1">Balance: {((activeAccount as any).amount / 1000000).toFixed(6)} ALGO</p>}
      </div>
    </div>
  );
};

export default Account;
