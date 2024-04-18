import { ethers } from 'ethers';

import { SwapPath, LiquidationPair } from '../types.js';
import { CHAIN_IDS } from './network.js';
import { KNOWN_TOKENS } from './tokens.js';

export const FLASH_LIQUIDATOR_CONTRACT_ADDRESS = '0x5927b63E88764D6250b7801eBfDEb7B6c1ac35d0';

const PRZUSDC_SWAP_PATH: SwapPath = [
  KNOWN_TOKENS[CHAIN_IDS.optimism].PRZUSDC,
  100,
  KNOWN_TOKENS[CHAIN_IDS.optimism].USDC,
  500,
  KNOWN_TOKENS[CHAIN_IDS.optimism].WETH,
];

const PRZWETH_SWAP_PATH: SwapPath = [
  KNOWN_TOKENS[CHAIN_IDS.optimism].PRZWETH,
  100,
  KNOWN_TOKENS[CHAIN_IDS.optimism].WETH,
];

/**
 * Default liquidation pairs
 */
export const FLASH_LIQUIDATION_PAIRS: LiquidationPair[] = [
  {
    chainId: CHAIN_IDS.optimism,
    address: '0x7d72e1043FBaCF54aDc0610EA8649b23055462f0',
    swapPath: PRZUSDC_SWAP_PATH,
    swapPathEncoded: ethers.utils.solidityPack(
      ['address', 'uint24', 'address', 'uint24', 'address'],
      PRZUSDC_SWAP_PATH,
    ),
  },
  {
    chainId: CHAIN_IDS.optimism,
    address: '0x006e714accBFEecD561a9B590e919402e871a91D',
    swapPath: PRZWETH_SWAP_PATH,
    swapPathEncoded: ethers.utils.solidityPack(['address', 'uint24', 'address'], PRZWETH_SWAP_PATH),
  },
];
