export const CHAIN_IDS = {
  mainnet: 1,
  optimism: 10,
  base: 8453,
  arbitrum: 42161,
  goerli: 5,
  optimismGoerli: 420,
  baseSepolia: 84532,
  arbitrumGoerli: 421613,
  arbitrumSepolia: 421614,
  sepolia: 11155111,
  optimismSepolia: 11155420,
};

export const CHAINS_BY_ID = {
  [CHAIN_IDS.mainnet]: '1 - Mainnet',
  [CHAIN_IDS.optimism]: '10 - Optimism',
  [CHAIN_IDS.base]: '8453 - Base',
  [CHAIN_IDS.arbitrum]: '42161 - Arbitrum',
  [CHAIN_IDS.goerli]: '5 - Goerli',
  [CHAIN_IDS.optimismGoerli]: '420 - Optimism Goerli',
  [CHAIN_IDS.baseSepolia]: '84532 - Base Sepolia',
  [CHAIN_IDS.arbitrumGoerli]: '421613 - Arbitrum Goerli',
  [CHAIN_IDS.arbitrumSepolia]: '421614 - Arbitrum Sepolia',
  [CHAIN_IDS.sepolia]: '11155111 - Sepolia',
  [CHAIN_IDS.optimismSepolia]: '11155420 - Optimism Sepolia',
};

export const FLASHBOTS_SUPPORTED_CHAINS = [1, 5];

export const NETWORK_NATIVE_TOKEN_INFO = {
  [CHAIN_IDS.mainnet]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.optimism]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.base]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.arbitrum]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.goerli]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.optimismGoerli]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.optimismSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.baseSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.arbitrumGoerli]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.arbitrumSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.sepolia]: { decimals: 18, symbol: 'ETH' },
};
