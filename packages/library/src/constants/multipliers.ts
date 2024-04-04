import { CHAIN_IDS } from './network.js';

export const CHAIN_GAS_PRICE_MULTIPLIERS = {
  [CHAIN_IDS.goerli]: 0.2, // our estimates will say $6 for 2,300,000 gas limit but etherscan reports fractions of a penny
  [CHAIN_IDS.sepolia]: 0.05, // if we want Sepolia to act more like Optimism/etc, set this to a fraction such as 0.1
  [CHAIN_IDS.arbitrumSepolia]: 0.15, // Get Arbitrum Sepolia to act more like Sepolia/etc
};
