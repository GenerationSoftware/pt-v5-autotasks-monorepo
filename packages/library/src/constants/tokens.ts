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
    POOL: '0xd675b9c8eea7f6bd506d5ff66a10cf7b887cd293',
    WBTC: '0x149e3B3Bd69f1Cfc1B42b6A6a152a42E38cEeBf1',
    WETH: '0xA416eD51158c5616b997B785FA6d18f02D0458A8',
    USDC: '0x8067F3Cb6Eef936256108FF19a05574b8aD99Cf3',
    DAI: '0xD590EC14364731B62265A5cc807164a17C6797D4',
    GUSD: '0x1a188719711d62423abf1a4de7d8aa9014a39d73',
    PDAILYT: '0x22c6258ea5b1e742d18c27d846e2aabd4505edc2',
    PDAIHYT: '0x15e5b4813942fa51835ceb7aff13f771c398d062',
    PUSDCLYT: '0x2891d69786650260b9f99a7b333058fcc5418df0',
    PUSDCHYT: '0xa3976b09b9695dfabc39a2e042f5bd5b7399ac60',
    PGUSDT: '0xd04756fe8b7a33741e1fa3a4ddd7e0075a0063ac',
    PWBTCT: '0xbe4e7d33a1144e977c3a2f51798cc451e1a76b2f',
    PWETH1: '0xaf25ffb53699aedba3daf97bb2adc1b5054053ea',
    PWETH2: '0x51d439f705911634263dfe265097645eb1a3c42a',
    PDAILY: '0xc0e72cda91be3d9a29608bc057668c087d4e4fb8',
    PDAIHY: '0x3608e470a44dc76ace77354f6be33cb0cde91803',
  },
};

export const LIQUIDATION_TOKEN_ALLOW_LIST = {
  [CHAIN_IDS.optimism]: [
    KNOWN_TOKENS[CHAIN_IDS.optimism].POOL.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimism].WETH.toLowerCase(),
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
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PWETH1.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PWETH2.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PDAILY.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PDAIHY.toLowerCase(),
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
  [optimismTokens.USDCE.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Optimism USDC -> Ethereum USDC
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
