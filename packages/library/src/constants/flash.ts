import { ethers } from 'ethers';

import { SwapPath, LiquidationPair } from '../types';
import { CHAIN_IDS } from './network';
import { KNOWN_TOKENS } from './tokens';

export const FLASH_LIQUIDATOR_CONTRACT_ADDRESS = '0x5927b63E88764D6250b7801eBfDEb7B6c1ac35d0';

const PUSDCE_SWAP_PATH: SwapPath = [
  KNOWN_TOKENS[CHAIN_IDS.optimism].PUSDCE,
  500,
  KNOWN_TOKENS[CHAIN_IDS.optimism].USDCE,
  500,
  KNOWN_TOKENS[CHAIN_IDS.optimism].WETH,
  10000,
  KNOWN_TOKENS[CHAIN_IDS.optimism].POOL,
];

const PUSDC_SWAP_PATH: SwapPath = [
  KNOWN_TOKENS[CHAIN_IDS.optimism].PUSDC,
  100,
  KNOWN_TOKENS[CHAIN_IDS.optimism].USDC,
  500,
  KNOWN_TOKENS[CHAIN_IDS.optimism].WETH,
  10000,
  KNOWN_TOKENS[CHAIN_IDS.optimism].POOL,
];

const PWETH_SWAP_PATH: SwapPath = [
  KNOWN_TOKENS[CHAIN_IDS.optimism].PWETH1,
  100,
  KNOWN_TOKENS[CHAIN_IDS.optimism].WETH,
  10000,
  KNOWN_TOKENS[CHAIN_IDS.optimism].POOL,
];

/**
 * Default liquidation pairs
 */
export const FLASH_LIQUIDATION_PAIRS: LiquidationPair[] = [
  {
    chainId: CHAIN_IDS.optimism,
    address: '0xe7680701a2794E6E0a38aC72630c535B9720dA5b',
    swapPath: PUSDCE_SWAP_PATH,
    swapPathEncoded: ethers.utils.solidityPack(
      ['address', 'uint24', 'address', 'uint24', 'address', 'uint24', 'address'],
      PUSDCE_SWAP_PATH,
    ),
  },
  {
    chainId: CHAIN_IDS.optimism,
    address: '0x217ef9C355f7eb59C789e0471dc1f4398e004EDc',
    swapPath: PUSDC_SWAP_PATH,
    swapPathEncoded: ethers.utils.solidityPack(
      ['address', 'uint24', 'address', 'uint24', 'address', 'uint24', 'address'],
      PUSDC_SWAP_PATH,
    ),
  },
  {
    chainId: CHAIN_IDS.optimism,
    address: '0xde5deFa124faAA6d85E98E56b36616d249e543Ca',
    swapPath: PWETH_SWAP_PATH,
    swapPathEncoded: ethers.utils.solidityPack(
      ['address', 'uint24', 'address', 'uint24', 'address'],
      PWETH_SWAP_PATH,
    ),
  },
];
