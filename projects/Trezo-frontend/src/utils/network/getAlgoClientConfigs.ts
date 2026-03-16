export interface AlgodConfig {
  server: string;
  port: string | number;
  token: string;
  network: string;
}

export interface IndexerConfig {
  server: string;
  port: string | number;
  token: string;
}

export interface KmdConfig {
  server: string;
  port: string | number;
  token: string;
}

export function getAlgodConfigFromViteEnvironment(): AlgodConfig {
  if (!import.meta.env.VITE_ALGOD_SERVER || !import.meta.env.VITE_ALGOD_PORT || !import.meta.env.VITE_ALGOD_NETWORK) {
    throw new Error(
      "Attempt to get algod configuration without specifying VITE_ALGOD_SERVER, VITE_ALGOD_PORT and VITE_ALGOD_NETWORK in the environment variables",
    );
  }

  return {
    server: import.meta.env.VITE_ALGOD_SERVER,
    port: import.meta.env.VITE_ALGOD_PORT,
    token: import.meta.env.VITE_ALGOD_TOKEN || "",
    network: import.meta.env.VITE_ALGOD_NETWORK,
  };
}

export function getIndexerConfigFromViteEnvironment(): IndexerConfig {
  if (!import.meta.env.VITE_INDEXER_SERVER || !import.meta.env.VITE_INDEXER_PORT) {
    throw new Error(
      "Attempt to get indexer configuration without specifying VITE_INDEXER_SERVER and VITE_INDEXER_PORT in the environment variables",
    );
  }

  return {
    server: import.meta.env.VITE_INDEXER_SERVER,
    port: import.meta.env.VITE_INDEXER_PORT,
    token: import.meta.env.VITE_INDEXER_TOKEN || "",
  };
}

export function getKmdConfigFromViteEnvironment(): KmdConfig {
  if (!import.meta.env.VITE_KMD_TOKEN || !import.meta.env.VITE_KMD_SERVER || !import.meta.env.VITE_KMD_PORT) {
    throw new Error(
      "Attempt to get kmd configuration without specifying VITE_KMD_TOKEN, VITE_KMD_SERVER and VITE_KMD_PORT in the environment variables",
    );
  }

  return {
    server: import.meta.env.VITE_KMD_SERVER,
    port: import.meta.env.VITE_KMD_PORT,
    token: import.meta.env.VITE_KMD_TOKEN,
  };
}
