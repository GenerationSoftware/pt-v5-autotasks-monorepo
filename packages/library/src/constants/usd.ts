import { CHAIN_IDS } from './network.js';

export const CHAIN_IDS_TO_COVALENT_LOOKUP = {
  [CHAIN_IDS.mainnet]: 'eth-mainnet',
  [CHAIN_IDS.arbitrum]: 'arbitrum-mainnet',
  [CHAIN_IDS.optimism]: 'optimism-mainnet',
  [CHAIN_IDS.base]: 'base-mainnet',
  // [CHAIN_IDS.arbitrumSepolia]: 'arbitrum-sepolia',
  // [CHAIN_IDS.sepolia]: 'eth-sepolia',
  // [CHAIN_IDS.optimismSepolia]: 'optimism-sepolia',
  // [CHAIN_IDS.baseSepolia]: 'base-sepolia-testnet',
};

// TODO: Would be ideal to find a way to remove this:
export const SYMBOL_TO_COINGECKO_LOOKUP = {
  POOL: 'pooltogether',
  LINK: 'chainlink',
  ETH: 'ethereum',
  WETH: 'ethereum',
  USDC: 'usd-coin',
  DAI: 'dai',
  GUSD: 'gemini-dollar',
  OP: 'optimism',
  USDA: 'angle-usd',
  wstETH: 'wrapped-steth',
  LUSD: 'liquity-usd',
};

export const NETWORK_NATIVE_TOKEN_ADDRESS_TO_ERC20_LOOKUP = {
  [CHAIN_IDS.mainnet]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  [CHAIN_IDS.arbitrum]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  [CHAIN_IDS.optimism]: '0x4200000000000000000000000000000000000006',
  [CHAIN_IDS.base]: '0x4200000000000000000000000000000000000006',
  [CHAIN_IDS.sepolia]: '',
  [CHAIN_IDS.arbitrumSepolia]: '',
  [CHAIN_IDS.optimismSepolia]: '',
  [CHAIN_IDS.baseSepolia]: '',
};
