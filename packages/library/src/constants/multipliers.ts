import { CHAIN_IDS } from './network.js';

export const CHAIN_GAS_PRICE_MULTIPLIERS = {
  [CHAIN_IDS.goerli]: 0.2, // our estimates will say $6 for 2,300,000 gas limit but etherscan reports fractions of a penny
  [CHAIN_IDS.arbitrumSepolia]: 0.15, // Get Arbitrum Sepolia to act more like Sepolia/etc
};

// This fixes the RngWitnet "reward too large" error we are receiving from the Witnet contracts
// It seems to want less of a reward on Optimism Mainnet then it does on any of the testnets
export const CHAIN_RNG_PAYMENT_AMOUNT_DIVISOR = {
  [CHAIN_IDS.optimism]: 50,
  [CHAIN_IDS.baseSepolia]: 1,
  [CHAIN_IDS.optimismSepolia]: 1,
  [CHAIN_IDS.arbitrumSepolia]: 1,
};
