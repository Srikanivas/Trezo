export interface NetworkConfig {
  algodServer: string;
  algodPort: number;
  algodToken: string;
  indexerServer: string;
  indexerPort: number;
  indexerToken: string;
  kmdServer?: string;
  kmdPort?: number;
  kmdToken?: string;
}

export interface NetworkEnvironment {
  name: string;
  config: NetworkConfig;
}
