import { CHAIN_IDS } from './network.js';

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
    USDC: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    USDCE: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
    DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    LUSD: '0xc40f949f8a4e094d1b49a23ea9241d289b7b2819',
    OP: '0x4200000000000000000000000000000000000042',
    SNX: '0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4',
    SUSD: '0x8c6f28f2F1A3C87F0f938b96d27520d9751ec8d9',
    VELO: '0x9560e827aF36c94D2Ac33a39bCE1Fe78631088Db',
    TBTC: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
    WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
    MSETH: '0x1610e3c85dd44Af31eD7f33a63642012Dca0C5A5',
    ALETH: '0x3E29D3A9316dAB217754d13b28646B76607c5f04',
    ERN: '0xc5b001DC33727F8F26880B184090D3E252470D45',
    WSTETH: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
    PRZUSDC: '0x03d3ce84279cb6f54f5e6074ff0f8319d830dafe',
    PRZWETH: '0x2998c1685e308661123f64b333767266035f5020',
    PRZDAI: '0x3e8dbe51da479f7e8ac46307af99ad5b4b5b41dc',
    PRZLUSD: '0x1f16d3ccf568e96019cedc8a2c79d2ca6257894e',
    PRZWSTETHETH: '0x9b4c0de59628c64b02d7ce86f21db9a579539d5a',
    PRZPOOLWETH: '0x9b53ef6f13077727d22cb4acad1119c79a97be17',
    PRZSSUSDYEARN: '0xCf6ABB37336E3A756b564E2c29222bf187A0dE2A',
    PRZVAMMV2USDCOP: '0x182d3050f7261494757638ff3345c7163e5990f3',
    PRZVAMMV2USDCSNX: '0xb4063d1f0b0b7caee88708895ec4e365bf44b984',
    PRZVAMMV2USDCVELO: '0x626F8282F712732be0C12D4A89a86bE6e9cE8AC8',
    PRZVAMMV2WETHTBTC: '0xE2778B7c04a44dC8480FeE88edc3cEF8ee11Fce0',
    PRZSAMMV2MSETHWETHYEARN: '0x54270c51054b63cf990501c50a9c0814a73b4f73',
    PRZSAMMV2WBTCTBTCYEARN: '0x05B0f53D5aa6Ba7Be05268d35a76bAA58952fD95',
    PRZSAMMV2ALETHWETHYEARN: '0x3F707a0f3AD1b2784CfbdDa17d7345fc0E689751',
    PRZSAMMV2USDCERNYEARN: '0x9f4a71c262e5fe634bbe3b9b1bd5dee2bba9e441',
    PRZSAMMV2USDCERNYEARN2: '0x3a14DdB934e785Cd1e29949EA814e8090D5F8b69',
  },
  [CHAIN_IDS.base]: {
    POOL: '0xd652c5425aea2afd5fb142e120fecf79e18fafc3',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    DAI: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb',
    LUSD: '0x368181499736d0c0cc614dbb145e2ec1ac86b8c6',
    AERO: '0x940181a94a35a4569e4529a3cdfb74e38fd98631',
    WELL: '0xa88594d404727625a9437c3f886c7643872296ae',
    USDA: '0x0000206329b97DB379d5E1Bf586BbDB969C63274',
    WSTETH: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
    PRZUSDC: '0x7f5c2b379b88499ac2b997db583f8079503f25b9',
    PRZWETH: '0x4e42f783db2d0c5bdff40fdc66fcae8b1cda4a43',
    PRZAERO: '0x8d1322CaBe5Ef2949f6bf4941Cc7765187C1091A',
    PRZCBETH: '0x5b623c127254c6fec04b492ecdf4b11c45fbb9d5',
    PRZWSTETH: '0x75d700f4c21528a2bb603b6ed899acfde5c4b086',
    PRZPOOLLUSD: '0x850ec48d2605aad9c3de345a6a357a9a14b8cf1b',
    PRZUSDA: '0x6bb041d7e70b7040611ef688b5e707a799ade60a',
    PRZUSDCAAVE: '0xa99ec0a1018bf964931c7dc421a5de8bca0e32f1',
    SUSUPRZUSDC: '0x985c54cdf07703b07f303a3039459d6b1dd7330a',
    PRZVAMMWETHWELLBEEFY: '0x6428ddb6ef1818fa99552e10882d34c1db57bbca',
  },
  [CHAIN_IDS.arbitrum]: {
    POOL: '0xcf934e2402a5e072928a39a956964eb8f2b5b79c',
    WETH: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    USDC: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    ARB: '0x912ce59144191c1204e64559fe8253a0e49e6548',
    USDA: '0x0000206329b97DB379d5E1Bf586BbDB969C63274',
    PRZWETH: '0x7b0949204e7da1b0bed6d4ccb68497f51621b574',
    PRZUSDC: '0x3c72a2a78c29d1f6454caa1bcb17a7792a180a2e',
    PRZUSDT: '0xcacba8be4bc225fb8d15a9a3b702f84ca3eba991',
    PRZUSDA: '0x8653084e01Bd8c9e24B9a8fEb2036251Ee0C16A9',
  },
  [CHAIN_IDS.gnosisChiado]: {
    OFFICIAL_WXDAI: '0x18c8a7ec7897177E4529065a7E7B0878358B3BfF',
    WETH: '0x6b629bb304017d3d985d140599d8e6fc9942b9a7',
    POOL: '0xa83a315bed18b36308a518c7f77a2464e9f7286c',
    USDC: '0xfc535b2407bb2c8b4f4a4faabbb9981ff031b7ca',
    DAI: '0xb2d0d7ad1d4b2915390dc7053b9421f735a723e7',
    GUSD: '0xbe9a62939f82e12f4a48912078a4420f1a5fc2e0',
    WBTC: '0x3e9c64afc24c551cc8e11f52fedecdacf7362559',
    PDAI: '',
    PUSDC: '',
    PWETH: '',
  },
  [CHAIN_IDS.arbitrumSepolia]: {
    WETH: '0x060fad1bca90e5b1efca0d93febec96e638fd8a6',
    USDC: '0x7b2e0bd66ef04d26db132391b5600af3887e9f9f',
    DAI: '0xfe045beefda06606fc5f441ccca2fe8c903e9725',
    PDAI: '0xca45845b69c441a5d319e36c8aacd99df806e95d',
    PUSDC: '0xba9926560c2161761f1d438b3eb7884df02436bb',
    PWETH: '0x9b47c08d066184e65efb82828e53c0ad1729f992',
  },
  [CHAIN_IDS.baseSepolia]: {
    POOL: '0x71b271952c3335e7258fbdcae5cd3a57e76b5b51',
    DAI: '0x82557c5157fcbeddd80ae09647ec018a0083a638',
    USDC: '0xc88130e55db4a3ba162984d6efe4ff982bc0e227',
    WETH: '0x41d7ddf285a08c74a4cb9fdc979c703b10c30ab1',
    GUSD: '0x431bf0fe8acb5c79c4f4fbc63f6de0756e928dd3',
    WBTC: '0x214e35ca60a828cc44fae2f2b97d37c116b02229',
    PDAI: '0x01f6351fe2651c411cd98910aae2adefcd034c59',
    PUSDC: '0xa51d2a8dd481800e9576aeb341340411b2b28679',
    PWETH: '0x137a5e9cf386ea09be2304f17052613609d24660',
    PGUSD: '0xed665c4c6ec4315131ea5266da4c3be4694d0615',
    PWBTC: '0x7ba33795f824c3494a7d8285e7cc20b83a7d7dba',
  },
  [CHAIN_IDS.scrollSepolia]: {
    OFFICIAL_WETH: '0xba4cec9b8137ddf02546534f14e438940ba58af6',
    WETH: '0x6b0877bcb4720f094bc13187f5e16bdbf730693a',
    POOL: '0x7026b77376547ba7961c16a4a05edae070abec47',
    USDC: '0x6f720053319f89c9670234989a5bd807a37d1792',
    DAI: '0xc024e95cf6bb2efc424c9035db4647a12d8dcac9',
    GUSD: '0x23dbacc4e588fadc2d3eed3d1eddb8daa57714ba',
    WBTC: '0xa15316214d52d907712d751987d4593972cf3b8b',
    PDAI: '',
    PUSDC: '',
    PWETH: '',
  },
  [CHAIN_IDS.sepolia]: {
    POOL: '0x68a100a3729fc04ab26fb4c0862df22ceec2f18b',
    LINK: '0x779877a7b0d9e8603169ddbd7836e478b4624789',
  },
  [CHAIN_IDS.optimismSepolia]: {
    POOL: '0x24ffb8ca3dea588b267a15f1d94766dcba034ae6',
    DAI: '0xef38f21ec5477f6e3d4b7e9f0dea44a788c669b0',
    USDC: '0xded96a50515f1a4620a3c5244fae15ed7d216d4a',
    WETH: '0x4a61b6f54157840e80e0c47f1a628c0b3744a739',
    GUSD: '0x68f92539f64e486f2853bb2892933a21b54829e5',
    WBTC: '0x6c6a62b0861d8f2b946456ba9dcd0f3baec54147',
    PDAI: '0xe039683d5f9717d6f74d252722546cfedab32250',
    PUSDC: '0xcc255d71c57a5d5f92183a66b7fc5589151adcd0',
    PWETH: '0xed2f166ad10b247f67c3fce7a4c8e0c5e54247ea',
    PGUSD: '0xe1498d24a398b588b5e3f2c5d230991304203ad9',
    PWBTC: '0x02dda5914b78f0751fdf5bbe2050efabd95dff46',
  },
};

export const LIQUIDATION_TOKEN_ALLOW_LIST = {
  [CHAIN_IDS.mainnet]: [],
  [CHAIN_IDS.optimism]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.optimism]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.base]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.base]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.arbitrum]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.arbitrum]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.scrollSepolia]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.scrollSepolia]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.baseSepolia]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.baseSepolia]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.arbitrumSepolia]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.gnosisChiado]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.gnosisChiado]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.sepolia]: [],
  [CHAIN_IDS.optimismSepolia]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.optimismSepolia]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
};

const mainnetTokens = KNOWN_TOKENS[CHAIN_IDS.mainnet];

const scrollSepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.scrollSepolia];
const baseSepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.baseSepolia];
const arbitrumSepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.arbitrumSepolia];
const gnosisChiadoTokens = KNOWN_TOKENS[CHAIN_IDS.gnosisChiado];
const sepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.sepolia];
const optimismSepoliaTokens = KNOWN_TOKENS[CHAIN_IDS.optimismSepolia];

export const ADDRESS_TO_COVALENT_LOOKUP = {
  [scrollSepoliaTokens.OFFICIAL_WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(),
  [gnosisChiadoTokens.OFFICIAL_WXDAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(),

  [baseSepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(),
  [sepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(),
  [optimismSepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(),
  [scrollSepoliaTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(),
  [gnosisChiadoTokens.POOL.toLowerCase()]: mainnetTokens.POOL.toLowerCase(),

  [arbitrumSepoliaTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(),
  [baseSepoliaTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(),
  [optimismSepoliaTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(),
  [scrollSepoliaTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(),
  [gnosisChiadoTokens.WETH.toLowerCase()]: mainnetTokens.WETH.toLowerCase(),

  [sepoliaTokens.LINK.toLowerCase()]: mainnetTokens.LINK.toLowerCase(),

  [baseSepoliaTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(),
  [optimismSepoliaTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(),
  [scrollSepoliaTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(),
  [gnosisChiadoTokens.WBTC.toLowerCase()]: mainnetTokens.WBTC.toLowerCase(),

  [arbitrumSepoliaTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(),
  [optimismSepoliaTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(),
  [baseSepoliaTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(),
  [scrollSepoliaTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(),
  [gnosisChiadoTokens.USDC.toLowerCase()]: mainnetTokens.USDC.toLowerCase(),

  [arbitrumSepoliaTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(),
  [optimismSepoliaTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(),
  [baseSepoliaTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(),
  [scrollSepoliaTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(),
  [gnosisChiadoTokens.DAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(),

  [optimismSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(),
  [baseSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(),
  [scrollSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(),
  [gnosisChiadoTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(),
};
