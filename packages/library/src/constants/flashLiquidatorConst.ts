import { ethers } from 'ethers';

import { SwapPath, LiquidationPair } from '../types.js';
import { CHAIN_IDS } from './network.js';
import { KNOWN_TOKENS } from './tokens.js';

export const FLASH_LIQUIDATOR_CONTRACT_ADDRESS = '0x5927b63E88764D6250b7801eBfDEb7B6c1ac35d0';

const OPTIMISM_OP_ETH_SWAP_PATH_1: SwapPath = [
  KNOWN_TOKENS[CHAIN_IDS.optimism].OP,
  3000, // 0.3%
  KNOWN_TOKENS[CHAIN_IDS.optimism].WETH,
];

/**
 * Default liquidation pairs
 */
export const FLASH_LIQUIDATION_PAIRS: LiquidationPair[] = [
  {
    chainId: CHAIN_IDS.optimism,
    address: '0x4729b5d1a83ec1fcf732e07fe351ab8a3e74efe9',
    swapPath: OPTIMISM_OP_ETH_SWAP_PATH_1,
    swapPathEncoded: ethers.utils.solidityPack(
      ['address', 'uint24', 'address'],
      OPTIMISM_OP_ETH_SWAP_PATH_1,
    ),
  },
];
