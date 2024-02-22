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
    POOL: '0x7396655c4ac7d32aa458d837b2749cd4db762564',
    WBTC: '0x4fe84045d2b9cc35d03e7551f79355b18b09ce90',
    WETH: '0xc7299b4791926efaf1800bd6ca470734954c6c02',
    USDC: '0x6daaa3e5c99cec675485d920fb6869deeae1c0bf',
    DAI: '0xe4f79f7050c43521b40cf84c16ad69aab0efbbb8',
    GUSD: '0x29615d775bcfd529744b9693ba417f814fe86ad3',
    PDAILYT: '0x0ffe33d8b2d93ff1eff4be866c87ae45c22fb681',
    PDAIHYT: '0x9f155a1586e0ad33213c506026aa3122cf041a19',
    PUSDCLYT: '0x92059f0145afa8a788f54577cb692a5c9960fc1c',
    PUSDCHYT: '0x170de99261a497d5b29aa2279cc2f3da0eb09b4b',
    PGUSDT: '0xd5f54456fa312a21872472dcd21bfe6978ab1fc7',
    PWBTCT: '0x9452a41e1d69894b5c47c3e0785e37e48c5dbb8f',
    PWETH1: '0x50088bf4dba58145c0b873643d285626f87837c3',
    PWETH2: '0x51d439f705911634263dfe265097645eb1a3c42a',
    PDAILY: '0xc0e72cda91be3d9a29608bc057668c087d4e4fb8',
    PDAIHY: '0x3608e470a44dc76ace77354f6be33cb0cde91803',
  },
  [CHAIN_IDS.optimismGoerli]: {
    POOL: '0xde142f273ed15546f9c61fa1ad23c0bfbc6aa26e',
    WBTC: '0xaa2ba5f173f7fda690feed8537a6323765e01638',
    WETH: '0x0877eb557dfeb0af4a6cf27df180bf6a87b46500',
    USDC: '0xaae82f396d7d22c7bca1759afa231743308c95f8',
    DAI: '0xd19e79720c364a9d2e14be8e43ef01c7776e99c1',
    GUSD: '0x91660eecd36a8905a33fa9a7750502a100886f7f',
    PDAILYT: '0x9407700d80fd43b8e9741d0202786fd09e553fdd',
    PDAIHYT: '0x9194be10aa807d2b2880695d6a5b94ff0a56299f',
    PUSDCLYT: '0x213533c9245145d06f0d86b218718ef8e3500513',
    PUSDCHYT: '0x596845f8608d40c79d7608b72adf79e99e6b7422',
    PGUSDT: '0x4a29c3375efe8eabcfb0134f051ecee6d8d3676b',
    PWBTCT: '0x36998a4c9d0124998aa825b91b4e9b1290ca2dbe',
    PWETHT: '0x5e3267003541a6743289a4e74ce46412d98bfef7',
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
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PWETH1.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PWETH2.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PDAILY.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismSepolia].PDAIHY.toLowerCase(),
  ],
  [CHAIN_IDS.optimismGoerli]: [
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].POOL.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].USDC.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].DAI.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].WETH.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].WBTC.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].GUSD.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].PDAILYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].PDAIHYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].PUSDCLYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].PUSDCHYT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].PGUSDT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].PWBTCT.toLowerCase(),
    KNOWN_TOKENS[CHAIN_IDS.optimismGoerli].PWETHT.toLowerCase(),
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
const optimismGoerliTokens = KNOWN_TOKENS[CHAIN_IDS.optimismGoerli];
const sepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.sepolia];
const arbitrumSepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia];

export const ADDRESS_TO_COVALENT_LOOKUP = {
  [sepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Sepolia POOL -> Ethereum POOL
  [arbitrumSepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Arb POOL Sepolia -> Ethereum POOL
  [optimismTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Optimism POOL -> Ethereum POOL
  [optimismSepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Optimism POOL Sepolia -> Ethereum POOL
  [optimismGoerliTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(), // Optimism POOL Goerli -> Ethereum POOL
  [sepoliaTokens.LINK.toLowerCase()]: mainnetTokens.LINK.toLowerCase(), // Sepolia LINK -> Ethereum LINK
  [arbitrumSepoliaTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(), // Arb WBTC Sepolia -> Ethereum WBTC
  [arbitrumSepoliaTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(), // Arb WETH Sepolia -> Ethereum WETH
  [optimismTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(), // Optimism WETH -> Ethereum WETH
  [optimismSepoliaTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(), // Optimism WBTC Sepolia -> Ethereum WETH
  [optimismGoerliTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(), // Optimism WBTC Goerli -> Ethereum WETH
  [optimismSepoliaTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(), // Optimism WETH Sepolia -> Ethereum WBTC
  [optimismGoerliTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(), // Optimism WETH Goerli -> Ethereum WBTC
  [optimismTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Optimism USDC -> Ethereum USDC
  [optimismTokens.USDCE.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Optimism USDC.e -> Ethereum USDC
  [arbitrumSepoliaTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Arb USDC Sepolia -> Ethereum USDC
  [optimismSepoliaTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Opt USDC Sepolia -> Ethereum USDC
  [optimismGoerliTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(), // Opt USDC Goerli -> Ethereum USDC
  [optimismTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(), // Optimism DAI -> Ethereum DAI
  [arbitrumSepoliaTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(), // Arb DAI Sepolia -> Ethereum DAI
  [optimismSepoliaTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(), // Opt DAI Sepolia -> Ethereum DAI
  [optimismGoerliTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(), // Opt DAI Goerli -> Ethereum DAI
  [optimismSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(), // Opt GUSD Sepolia -> Ethereum GUSD
  [optimismGoerliTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(), // Opt GUSD Goerli -> Ethereum GUSD
  [arbitrumSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(), // Arb GUSD Sepolia -> Ethereum GUSD
  [optimismTokens.LUSD.toLowerCase()]: mainnetTokens.LUSD.toLowerCase(), // Optimism LUSD -> Ethereum LUSD
  [optimismTokens.OP.toLowerCase()]: mainnetTokens.OP.toLowerCase(), // Optimism OP -> Ethereum OP
};
