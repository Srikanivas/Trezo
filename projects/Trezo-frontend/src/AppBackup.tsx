import { SupportedWallet, WalletId, WalletManager, WalletProvider } from "@txnlab/use-wallet-react";
import { SnackbarProvider } from "notistack";
import SimpleHero from "./components/SimpleHero";
import ErrorBoundary from "./components/ErrorBoundary";
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from "./utils/network/getAlgoClientConfigs";

let supportedWallets: SupportedWallet[] = [];
let walletManager: WalletManager | null = null;

// Only initialize wallet manager if we have proper environment variables
try {
  if (import.meta.env.VITE_ALGOD_NETWORK === "localnet") {
    const kmdConfig = getKmdConfigFromViteEnvironment();
    supportedWallets = [
      {
        id: WalletId.KMD,
        options: {
          baseServer: kmdConfig.server,
          token: String(kmdConfig.token),
          port: String(kmdConfig.port),
        },
      },
    ];
  } else {
    // TestNet and MainNet wallets
    supportedWallets = [{ id: WalletId.DEFLY }, { id: WalletId.PERA }, { id: WalletId.EXODUS }];
  }

  const algodConfig = getAlgodConfigFromViteEnvironment();
  walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token || ""),
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  });
} catch (error) {
  console.warn("Wallet manager initialization failed, running in wallet creation only mode:", error);
}

export default function AppBackup() {
  return (
    <ErrorBoundary>
      <SnackbarProvider maxSnack={3}>
        {walletManager ? (
          <WalletProvider manager={walletManager}>
            <SimpleHero />
          </WalletProvider>
        ) : (
          <SimpleHero />
        )}
      </SnackbarProvider>
    </ErrorBoundary>
  );
}
