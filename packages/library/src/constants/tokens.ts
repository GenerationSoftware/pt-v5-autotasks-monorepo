import { CHAIN_IDS } from './network';

export const KNOWN_TOKENS = {
  [CHAIN_IDS.mainnet]: {
    POOL: '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e',
    WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
    LUSD: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0',
    GUSD: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd',
    OP: '0x2eecb20df51dc76d05afcf1270c73a2ff1035388',
    LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
  },
  [CHAIN_IDS.optimism]: {
    POOL: '0x395ae52bb17aef68c2888d941736a71dc6d4e125',
    WETH: '0x4200000000000000000000000000000000000006',
    USDCE: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
    DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    LUSD: '0xc40f949f8a4e094d1b49a23ea9241d289b7b2819',
    OP: '0x4200000000000000000000000000000000000042',
    PUSDCE: '0xe3b3a464ee575e8e25d2508918383b89c832f275',
    PWETH1: '0x29cb69d4780b53c1e5cd4d2b817142d2e9890715',
    PWETH2: '0xf0b19f02c63d51b69563a2b675e0160e1c34397c',
    PDAI: '0xce8293f586091d48a0ce761bbf85d5bcaa1b8d2b',
    PLUSD: '0x2ac482d67f009acfc242283b6d86bc6dd4e2ee4f',
    PPOOL: '0xbd8fd33e53ab4120638c34cbd454112b39f6b382',
    PUSDC: '0x77935f2c72b5eb814753a05921ae495aa283906b',
    PTOP: '0x87b1a4956b51be39781678677b0dd695a0c70f1e',
    POP: '0x457b69984315b53a1d8130b03b618cd98dd482a1',
    USDC: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  },
  [CHAIN_IDS.sepolia]: {
    POOL: '0x68a100a3729fc04ab26fb4c0862df22ceec2f18b',
    LINK: '0x779877a7b0d9e8603169ddbd7836e478b4624789',
  },
  [CHAIN_IDS.arbitrumSepolia]: {
    POOL: '0xf401d1482dfaa89a050f111992a222e9ad123e14',
    WBTC: '0x1bc266e1f397517ece9e384c55c7a5414b683639',
    WETH: '0x779275fc1b987db24463801f3708f42f3c6f6ceb',
    USDC: '0x7a6dbc7ff4f1a2d864291db3aec105a8eee4a3d2',
    DAI: '0x08c19fe57af150a1af975cb9a38769848c7df98e',
    GUSD: '0xb84460d777133a4b86540d557db35952e4adfee7',
    PDAILYT: '0x3adaa1d4f23c82130e1681c2ca9b38f5fb9a0892',
    PDAIHYT: '0x4dbf73fe0d23a6d275aefebc7c00600045ab8b9e',
    PUSDCLYT: '0xa723cf5d90c1a472c7de7285e5bd314aea107ede',
    PUSDCHYT: '0xb81b725b16e99c840ac17b396590da9c93c5bc3b',
    PWETH1: '0xe3235057ee444e9f53a5f41e66c03348c68b22c2',
    PWETH2: '0xa5905161eab67b6a13104537a09a949ef043366e',
  },
  [CHAIN_IDS.optimismSepolia]: {
    POOL: '0xb654cd9f5289873ba3c732e020df5209575e98a8',
    WBTC: '0x219b8d677ef97a1843ffd76e458dc1c6ec5d13d0',
    WETH: '0x2c75541abd0e0025ca13d0dd5ee5c9a697dd3802',
    USDC: '0x7b5aca06602c92ce6e596f68de8dc26e2d314181',
    DAI: '0xc3d427dbfc3c61e0ee6e84ff4f9fc105fbec8fba',
    GUSD: '0xbd9c18cb9b017a61cff7def2ad791c9e1cb51cac',
    PDAILYT: '0x8cbc0b1905225035ae55ae8a41de3517d2473cb3',
    PDAIHYT: '0x294e61b36563629a2892eeeb242f3521a7f245bd',
    PUSDCLYT: '0x0307dd00524569494fb70cb1371a560483289a5f',
    PUSDCHYT: '0x56bc044ee45fcb692e1dd64fb376dfb382c48575',
    PGUSDT: '0x1367b99e644783533448f6ac64b12e186ea1df75',
    PWBTCT: '0xe345b0a1ed74c9ca862287c06c2d94331cd185d1',
    PWETH: '0xdebf8e51022afce5263d62f5afce188d86f6e94d',
  },
};

export const LIQUIDATION_TOKEN_ALLOW_LIST = {
  [CHAIN_IDS.optimism]: [
    KNOWN_TOKENS[CHAIN_IDS.optimism].POOL.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].WETH.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].USDC.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].USDCE.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].DAI.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].LUSD.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].OP.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].PUSDCE.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].PWETH1.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].PWETH2.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].PDAI.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].PLUSD.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].PPOOL.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].PUSDC.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].PTOP.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].POP.toLowerCase(),
  ],
  [CHAIN_IDS.optimismSepolia]: [
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].POOL.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].USDC.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].DAI.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PDAILYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PDAIHYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PUSDCLYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PUSDCHYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PGUSDT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PWBTCT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PWETH.toLowerCase(),
  ],
  [CHAIN_IDS.arbitrumSepolia]: [
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].POOL.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].USDC.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].DAI.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].PDAILYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].PDAIHYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].PUSDCLYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].PUSDCHYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].PWETH1.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia].PWETH2.toLowerCase(),
  ],
};

const mainnetTokens = KNOWN_TOKENS[CHAIN_IDS.mainnet];
const optimismTokens = KNOWN_TOKENS[CHAIN_IDS.optimism];
const optimismSepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.optimismSepolia];
const sepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.sepolia];
const arbitrumSepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia];

export const ADDRESS_TO_COVALENT_LOOKUP = {
  [sepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Sepolia POOL -> Ethereum POOL
  [arbitrumSepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Arb POOL Sepolia -> Ethereum POOL
  [optimismTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Optimism POOL -> Ethereum POOL
  [optimismSepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Optimism POOL Sepolia -> Ethereum POOL
  [sepoliaTokens.LINK.toLowerCase()]: mainnetTokens.LINK.toLowerCase(), // Sepolia LINK -> Ethereum LINK
  [arbitrumSepoliaTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(), // Arb WBTC Sepolia -> Ethereum WBTC
  [arbitrumSepoliaTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(), // Arb WETH Sepolia -> Ethereum WETH
  [optimismTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(), // Optimism WETH -> Ethereum WETH
  [optimismSepoliaTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(), // Optimism WBTC Sepolia -> Ethereum WETH
  [optimismSepoliaTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(), // Optimism WETH Sepolia -> Ethereum WBTC
  [optimismTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Optimism USDC -> Ethereum USDC
  [optimismTokens.USDCE.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Optimism USDC.e -> Ethereum USDC
  [arbitrumSepoliaTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Arb USDC Sepolia -> Ethereum USDC
  [optimismSepoliaTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Opt USDC Sepolia -> Ethereum USDC
  [optimismTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(), // Optimism DAI -> Ethereum DAI
  [arbitrumSepoliaTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(), // Arb DAI Sepolia -> Ethereum DAI
  [optimismSepoliaTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(), // Opt DAI Sepolia -> Ethereum DAI
  [optimismSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(), // Opt GUSD Sepolia -> Ethereum GUSD
  [arbitrumSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(), // Arb GUSD Sepolia -> Ethereum GUSD
  [optimismTokens.LUSD.toLowerCase()]: mainnetTokens.LUSD.toLowerCase(), // Optimism LUSD -> Ethereum LUSD
  [optimismTokens.OP.toLowerCase()]: mainnetTokens.OP.toLowerCase(), // Optimism OP -> Ethereum OP
};
