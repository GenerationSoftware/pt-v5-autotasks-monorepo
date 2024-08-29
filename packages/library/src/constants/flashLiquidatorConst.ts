import { ethers } from 'ethers';

import { SwapPath, LiquidationPairs } from '../types.js';
import { CHAIN_IDS } from './network.js';
import { KNOWN_TOKENS } from './tokens.js';

export const FLASH_LIQUIDATOR_CONTRACT_ADDRESS: Record<number, string> = {
  [CHAIN_IDS.mainnet]: '0xf22df1eb029126add8fb9b273ff8c8ced8413d04',
  [CHAIN_IDS.optimism]: '0x5927b63E88764D6250b7801eBfDEb7B6c1ac35d0',
  [CHAIN_IDS.base]: '0xe2368df1f78bc5b714b7f502de8e2b545c6fe7ec',
};

const OPTIMISM_OP_ETH_SWAP_PATH: SwapPath = [
  KNOWN_TOKENS[CHAIN_IDS.optimism].OP,
  3000, // 0.3%
  KNOWN_TOKENS[CHAIN_IDS.optimism].WETH,
];

const BASE_WSTETH_WETH_SWAP_PATH: SwapPath = [
  KNOWN_TOKENS[CHAIN_IDS.base].WSTETH,
  100, // 0.01%
  KNOWN_TOKENS[CHAIN_IDS.base].WETH,
];

export const FLASH_LIQUIDATION_PAIRS: LiquidationPairs = {
  [CHAIN_IDS.optimism]: [
    {
      chainId: CHAIN_IDS.optimism,
      address: '0x4729b5d1a83ec1fcf732e07fe351ab8a3e74efe9',
      swapPath: OPTIMISM_OP_ETH_SWAP_PATH,
      swapPathEncoded: ethers.utils.solidityPack(
        ['address', 'uint24', 'address'],
        OPTIMISM_OP_ETH_SWAP_PATH,
      ),
    },
  ],
  [CHAIN_IDS.base]: [
    {
      chainId: CHAIN_IDS.base,
      address: '0xeebdd08a67130e3a56e30ef950d56033b7d1d9f1',
      swapPath: BASE_WSTETH_WETH_SWAP_PATH,
      swapPathEncoded: ethers.utils.solidityPack(
        ['address', 'uint24', 'address'],
        BASE_WSTETH_WETH_SWAP_PATH,
      ),
    },
  ],
};
