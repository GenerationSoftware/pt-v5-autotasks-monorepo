import { ethers } from 'ethers';

import { SwapPath, LiquidationPair } from '../types.js';
import { CHAIN_IDS } from './network.js';
import { KNOWN_TOKENS } from './tokens.js';

export const UNISWAP_V2_FLASH_LIQUIDATOR_CONTRACT_ADDRESS = {
  [CHAIN_IDS.optimism]: '0x5927b63E88764D6250b7801eBfDEb7B6c1ac35d0',
};

export const UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS = {
  [CHAIN_IDS.optimism]: '0xB56D699B27ca6ee4a76e68e585999E552105C10f',
};

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
