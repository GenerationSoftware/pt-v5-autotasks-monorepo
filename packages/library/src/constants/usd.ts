import { CHAIN_IDS } from './network.js';

export const CHAIN_IDS_TO_COVALENT_LOOKUP = {
  [CHAIN_IDS.mainnet]: 'eth-mainnet',
  [CHAIN_IDS.arbitrum]: 'arbitrum-mainnet',
  [CHAIN_IDS.optimism]: 'optimism-mainnet',
  [CHAIN_IDS.base]: 'base-mainnet',
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
  sUSD: 'susd-optimism',
  tBTC: 'tbtc',
  VELO: 'velodrome-finance',
  SNX: 'synthetix-network-token',
  ERN: 'ethos-reserve-note',
  alETH: 'alchemix-eth',
  WBTC: 'wrapped-bitcoin',
  WELL: 'moonwell',
  AERO: 'aerodrome-finance',
  cbETH: 'coinbase-wrapped-staked-eth',
  WLD: 'worldcoin-wld',
  aEthLidoWETH: 'ethereum',
};

export const NETWORK_NATIVE_TOKEN_ADDRESS_TO_ERC20_LOOKUP = {
  [CHAIN_IDS.mainnet]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  [CHAIN_IDS.arbitrum]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  [CHAIN_IDS.optimism]: '0x4200000000000000000000000000000000000006',
  [CHAIN_IDS.base]: '0x4200000000000000000000000000000000000006',
  [CHAIN_IDS.scroll]: '0x5300000000000000000000000000000000000004',
  [CHAIN_IDS.gnosis]: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
  [CHAIN_IDS.sepolia]: '',
  [CHAIN_IDS.arbitrumSepolia]: '',
  [CHAIN_IDS.optimismSepolia]: '',
  [CHAIN_IDS.baseSepolia]: '',
  [CHAIN_IDS.worldSepolia]: '0x211db8fbdc34982654e39b1b3a8ca3ef5c7826ea',
  [CHAIN_IDS.gnosisChiado]: '0x18c8a7ec7897177e4529065a7e7b0878358b3bff',
  [CHAIN_IDS.scrollSepolia]: '0xba4cec9b8137ddf02546534f14e438940ba58af6',
};
