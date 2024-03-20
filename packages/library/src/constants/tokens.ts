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
    POOL: '0x264954576da8496cc0d2216df81a7d7a38857329',
    WBTC: '0x42fd018a6ac84478f28b3f7e322271c83064d737',
    WETH: '0x1bcd630e1303cef37f19743fbfe84b1b14e7750c',
    USDC: '0xe9cb1a8c3c1b5bce7c6c0fb15f31a3a56209207f',
    DAI: '0x34f166839c655f2dcd56638f2ce779fd9b5987a6',
    GUSD: '0xce1fe3170d4acefbc3d06595eef3a918f65000c2',
    PDAILYT: '0x332b1eb2cc4046954725ebdfb8143fb8354ea9a7',
    PDAIHYT: '0x13e37b0ca8b48fc2818c177c24635f90c1495c5c',
    PUSDCLYT: '0x602d77e900ecd48ac9b51151936dcc5efe2e7fae',
    PUSDCHYT: '0xa2b0321b671a83a98ff1f5a680b700864f57c6e7',
    PGUSDT: '0xd96702995b2bbd78a9a39ef86f4fa5f9704fdc7d',
    PWBTCT: '0xe77db9f8b68bc47a82d4f47e68fb57535df0086e',
    PWETH: '0x98ced5d595e8981756f063db8d3c44a6be9a8f86',
    PUSDC: '0x35f65c81b332ed0cdce72e841db4384bc12f8326',
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
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].WBTC.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].WETH.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].USDC.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].DAI.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PDAILYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PDAIHYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PUSDCLYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PUSDCHYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PGUSDT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PWBTCT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PWETH.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PUSDC.toLowerCase(),
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
