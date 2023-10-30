// Inquirer config variable switches:
export const CHAIN_IDS = {
  mainnet: 1,
  goerli: 5,
  optimism: 10,
  optimismGoerli: 420,
  arbitrum: 42161,
  arbitrumGoerli: 421613,
  sepolia: 11155111,
};

export const FLASHBOTS_SUPPORTED_CHAINS = [1, 5];

export const NETWORK_NATIVE_TOKEN_INFO = {
  1: { decimals: 18, symbol: 'ETH' },
  5: { decimals: 18, symbol: 'ETH' },
  10: { decimals: 18, symbol: 'ETH' },
  420: { decimals: 18, symbol: 'ETH' },
  42161: { decimals: 18, symbol: 'ETH' },
  421613: { decimals: 18, symbol: 'ETH' },
  11155111: { decimals: 18, symbol: 'ETH' },
  80001: { decimals: 18, symbol: 'MATIC' },
};

export const canUseIsPrivate = (chainId, useFlashbots) => {
  const chainSupportsFlashbots = FLASHBOTS_SUPPORTED_CHAINS.includes(chainId);
  const isPrivate = Boolean(chainSupportsFlashbots && useFlashbots);

  return isPrivate;
};
