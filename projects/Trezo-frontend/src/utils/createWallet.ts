import algosdk from "algosdk";

export interface WalletInfo {
  address: string;
  mnemonic: string;
  secretKey: Uint8Array;
}

export function createWallet(): WalletInfo {
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

  return {
    address: account.addr.toString(),
    mnemonic,
    secretKey: account.sk,
  };
}

export function recoverWallet(mnemonic: string): WalletInfo {
  const secretKey = algosdk.mnemonicToSecretKey(mnemonic);

  return {
    address: secretKey.addr.toString(),
    mnemonic,
    secretKey: secretKey.sk,
  };
}
