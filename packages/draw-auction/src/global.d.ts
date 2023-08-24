declare global {
  const BUILD_CHAIN_ID: number;
  const BUILD_RELAY_CHAIN_ID: string;
  const BUILD_RELAY_RELAYER_API_KEY: string;
  const BUILD_RELAY_RELAYER_API_SECRET: string;
  const BUILD_JSON_RPC_URI: string;
  const BUILD_RELAY_JSON_RPC_URI: string;
  const BUILD_REWARD_RECIPIENT: string;
  const BUILD_USE_FLASHBOTS: boolean;
  const BUILD_MIN_PROFIT_THRESHOLD_USD: number;
  const BUILD_COVALENT_API_KEY: string;
}

export {};
