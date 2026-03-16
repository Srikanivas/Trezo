import algosdk from "algosdk";
import { logger } from "../utils/logger";

// Algorand client configuration
const algodToken = process.env.ALGOD_TOKEN || "";
const algodServer = process.env.ALGOD_SERVER || "https://testnet-api.algonode.cloud";
const algodPort = parseInt(process.env.ALGOD_PORT || "443");

const indexerToken = process.env.INDEXER_TOKEN || "";
const indexerServer = process.env.INDEXER_SERVER || "https://testnet-idx.algonode.cloud";
const indexerPort = parseInt(process.env.INDEXER_PORT || "443");

// Create Algorand clients
export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
export const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);

// Test connections
export const testAlgorandConnection = async (): Promise<void> => {
  try {
    const status = await algodClient.status().do();
    logger.info(`Connected to Algorand ${process.env.ALGOD_NETWORK} - Round: ${status.lastRound}`);

    const health = await indexerClient.makeHealthCheck().do();
    logger.info("Connected to Algorand Indexer");
  } catch (error) {
    logger.error("Failed to connect to Algorand:", error);
    throw error;
  }
};
