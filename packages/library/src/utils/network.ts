// Inquirer config variable switches:
export const CHAIN_IDS = { mumbai: 80001, goerli: 5, mainnet: 1, sepolia: 11155111 };

// TODO: Not sure if Sepolia will work for private flashbots txs, need to test:
export const FLASHBOTS_SUPPORTED_CHAINS = [1, 5, 11155111];

export const NETWORK_NATIVE_TOKEN_INFO = {
  1: { decimals: 18, symbol: "ETH" },
  5: { decimals: 18, symbol: "ETH" },
  11155111: { decimals: 18, symbol: "ETH" },
  80001: { decimals: 18, symbol: "MATIC" },
};

export const TESTNET_NETWORK_NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
