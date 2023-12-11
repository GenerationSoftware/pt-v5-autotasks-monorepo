// Inquirer config variable switches:
export const CHAIN_IDS = {
  mainnet: 1,
  goerli: 5,
  optimism: 10,
  optimismGoerli: 420,
  arbitrum: 42161,
  arbitrumGoerli: 421613,
  arbitrumSepolia: 421614,
  sepolia: 11155111,
  optimismSepolia: 11155420,
};

export const CHAINS_BY_ID = {
  [CHAIN_IDS.mainnet]: '1 - Mainnet',
  [CHAIN_IDS.optimism]: '10 - Optimism',
  [CHAIN_IDS.arbitrum]: '42161 - Arbitrum',
  [CHAIN_IDS.goerli]: '5 - Goerli',
  [CHAIN_IDS.optimismGoerli]: '420 - Optimism Goerli',
  [CHAIN_IDS.optimismSepolia]: '11155420 - Optimism Sepolia',
  [CHAIN_IDS.arbitrumGoerli]: '421613 - Arbitrum Goerli',
  [CHAIN_IDS.arbitrumSepolia]: '421614 - Arbitrum Sepolia',
  [CHAIN_IDS.sepolia]: '11155111 - Sepolia',
};

export const FLASHBOTS_SUPPORTED_CHAINS = [1, 5];

export const NETWORK_NATIVE_TOKEN_INFO = {
  [CHAIN_IDS.mainnet]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.optimism]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.arbitrum]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.goerli]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.optimismGoerli]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.optimismSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.arbitrumGoerli]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.arbitrumSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.sepolia]: { decimals: 18, symbol: 'ETH' },
  // 80001: { decimals: 18, symbol: 'MATIC' },
};

export const canUseIsPrivate = (chainId, useFlashbots) => {
  const chainSupportsFlashbots = FLASHBOTS_SUPPORTED_CHAINS.includes(chainId);
  const isPrivate = Boolean(chainSupportsFlashbots && useFlashbots);

  return isPrivate;
};

export const chainName = (chainId: number) => {
  return `${CHAINS_BY_ID[chainId]}`;
};
