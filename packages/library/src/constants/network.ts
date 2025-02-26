export const CHAIN_IDS = {
  mainnet: 1,
  optimism: 10,
  gnosis: 100,
  world: 480,
  base: 8453,
  arbitrum: 42161,
  scroll: 534352,
  worldSepolia: 4801,
  gnosisChiado: 10200,
  baseSepolia: 84532,
  arbitrumSepolia: 421614,
  scrollSepolia: 534351,
  sepolia: 11155111,
  optimismSepolia: 11155420,
};

export const CHAINS_BY_ID = {
  [CHAIN_IDS.mainnet]: '1 - Mainnet',
  [CHAIN_IDS.optimism]: '10 - Optimism',
  [CHAIN_IDS.gnosis]: '100 - Gnosis',
  [CHAIN_IDS.world]: '480 - World',
  [CHAIN_IDS.base]: '8453 - Base',
  [CHAIN_IDS.arbitrum]: '42161 - Arbitrum',
  [CHAIN_IDS.scroll]: '534352 - Scroll',
  [CHAIN_IDS.worldSepolia]: '4801 - World Sepolia',
  [CHAIN_IDS.gnosisChiado]: '10200 - Gnosis Chiado',
  [CHAIN_IDS.baseSepolia]: '84532 - Base Sepolia',
  [CHAIN_IDS.arbitrumSepolia]: '421614 - Arbitrum Sepolia',
  [CHAIN_IDS.scrollSepolia]: '534351 - Scroll Sepolia',
  [CHAIN_IDS.sepolia]: '11155111 - Sepolia',
  [CHAIN_IDS.optimismSepolia]: '11155420 - Optimism Sepolia',
};

export const NETWORK_NATIVE_TOKEN_INFO = {
  [CHAIN_IDS.mainnet]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.optimism]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.gnosis]: { decimals: 18, symbol: 'XDAI' },
  [CHAIN_IDS.world]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.base]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.arbitrum]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.scroll]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.worldSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.gnosisChiado]: { decimals: 18, symbol: 'XDAI' },
  [CHAIN_IDS.baseSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.arbitrumSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.scrollSepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.sepolia]: { decimals: 18, symbol: 'ETH' },
  [CHAIN_IDS.optimismSepolia]: { decimals: 18, symbol: 'ETH' },
};

const TESTNET_CHAIN_IDS = [
  CHAIN_IDS.worldSepolia,
  CHAIN_IDS.gnosisChiado,
  CHAIN_IDS.baseSepolia,
  CHAIN_IDS.arbitrumSepolia,
  CHAIN_IDS.scrollSepolia,
  CHAIN_IDS.sepolia,
  CHAIN_IDS.optimismSepolia,
];

export const isTestnet = (chainId: number): boolean => {
  return TESTNET_CHAIN_IDS.includes(chainId);
};

export const BLOCK_EXPLORER_URLS = {
  [CHAIN_IDS.mainnet]: 'https://etherscan.io',
  [CHAIN_IDS.optimism]: 'https://optimistic.etherscan.io',
  [CHAIN_IDS.gnosis]: 'https://gnosisscan.io',
  [CHAIN_IDS.world]: 'https://worldscan.org',
  [CHAIN_IDS.base]: 'https://basescan.org',
  [CHAIN_IDS.arbitrum]: 'https://arbiscan.io',
  [CHAIN_IDS.scroll]: 'https://scrollscan.com',
  [CHAIN_IDS.worldSepolia]: 'https://sepolia.worldscan.org',
  [CHAIN_IDS.gnosisChiado]: 'https://gnosis-chiado.blockscout.com',
  [CHAIN_IDS.baseSepolia]: 'https://sepolia.basescan.org',
  [CHAIN_IDS.arbitrumSepolia]: 'https://sepolia.arbiscan.io',
  [CHAIN_IDS.scrollSepolia]: 'https://sepolia.scrollscan.com',
  [CHAIN_IDS.sepolia]: 'https://sepolia.etherscan.io',
  [CHAIN_IDS.optimismSepolia]: 'https://sepolia-optimism.etherscan.io',
};
