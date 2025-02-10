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
    USDS: '0xdc035d45d973e3ec169d2276ddab16f1e407384f',
    PRZWETH: '0x3acd377da549010a197b9ed0f271e1f621e4b62e',
    PRZUSDC: '0x96fe7b5762bd4405149a9a313473e68a8e870f6c',
    PRZUSDS: '0x8ab157b779c72e2348364b5f8148cc45f63a8724',
    YEARNPRZUSDC: '0x3a49f5a6a8af9b2103d882278193112cf9f73a25',
    YEARNPRZDAI: '0x4147cb38fae27a737ecd55551d3315fec11c28d2',
    AETHLIDOWETH: '0xfa1fdbbd71b0aa16162d76914d69cd8cb3ef92da',
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
  [CHAIN_IDS.gnosis]: {
    WXDAI: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d',
    PRZWXDAI: '0xbb7e99abccce01589ad464ff698ad139b0705d90',
  },
  [CHAIN_IDS.world]: {
    WLD: '',
    PRZWLD: '',
    PRZWETH: '',
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
    MORPHO: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842',
    BOLD: '0x087c440f251ff6cfe62b86dde1be558b95b4bb9b',
    TBTC: '0x236aa50979d5f3de3bd1eeb40e81137f22ab794b',
    CBBTC: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
    WSTETH: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
    SUPEROETHB: '0xdbfefd2e8460a6ee4955a68582f85708baea60a3',
    PRZUSDC: '0x7f5c2b379b88499ac2b997db583f8079503f25b9',
    PRZWETH: '0x4e42f783db2d0c5bdff40fdc66fcae8b1cda4a43',
    PRZAERO: '0x8d1322CaBe5Ef2949f6bf4941Cc7765187C1091A',
    PRZCBETH: '0x5b623c127254c6fec04b492ecdf4b11c45fbb9d5',
    PRZWSTETH: '0x75d700f4c21528a2bb603b6ed899acfde5c4b086',
    PRZPOOLLUSD: '0x850ec48d2605aad9c3de345a6a357a9a14b8cf1b',
    PRZUSDA: '0x6bb041d7e70b7040611ef688b5e707a799ade60a',
    PRZUSDCAAVE: '0xa99ec0a1018bf964931c7dc421a5de8bca0e32f1',
    PRZSUPEROETHB: '0x78adc13c9ab327c79d10cab513b7c6bd3b346858',
    PRZUSDCCLASSIC: '0xaf2b22b7155da01230d72289dcecb7c41a5a4bd8',
    PRZUSDCMOONMORPHO: '0xada66220fe59c7374ea6a93bd211829d5d0af75d',
    PRZEURCMOONMORPHO: '0xdd5e858c0aa9311c4b49bc8d35951f7f069ff46a',
    PRZWETHMOONMORPHO: '0xd56f6f32473d6321512956a1351d4bcec07914cb',
    PRZVAMMWETHWELLBEEFY: '0x6428ddb6ef1818fa99552e10882d34c1db57bbca',
    SUSUPRZUSDC: '0x985c54cdf07703b07f303a3039459d6b1dd7330a',
    PSUPEROETHGIV: '0x48c773aa0023980c3123acd4ae1d59753f812067',
    PRZSAMMTBTCCBBTC: '0x06730eacdce903d563721e39f16622845427f662',
    PRZSAMMBOLDUSDC: '0xd79288f9b450aeee8691e3bf0006a15a516a29bc',
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
    YEARNPRZUSDT: '0x801c26fcfd916719631e0cf7d36ca1e049df0373',
    YEARNPRZUSDCE1: '0x482cc95bc6c92d6254529dc2d45095663ae726a2',
    YEARNPRZUSDCE2: '0x723a85b4554d79ed20e061efc64c5a6e04f196aa',
  },
  [CHAIN_IDS.scroll]: {
    WETH: '0x5300000000000000000000000000000000000004',
    PRZWETH: '0xfeb0fe9850aba3a52e72a8a694d422c2b47a5888',
  },
  [CHAIN_IDS.worldSepolia]: {
    WLD: '0x8803e47fD253915F9c860837f391Aa71B3e03c5A',
    PRZWLD: '0xaaf954c54fae10877bf0a0ba9f5ca6129e13e450',
    PRZWETH: '0xd262c57B43b9198e5375dD28fB6bCFE86557b4e6',
  },
  [CHAIN_IDS.gnosisChiado]: {
    OFFICIAL_WXDAI: '0x18c8a7ec7897177E4529065a7E7B0878358B3BfF',
    WETH: '0x6b629bb304017d3d985d140599d8e6fc9942b9a7',
    POOL: '0xa83a315bed18b36308a518c7f77a2464e9f7286c',
    USDC: '0xfc535b2407bb2c8b4f4a4faabbb9981ff031b7ca',
    WXDAI: '0xb2d0d7ad1d4b2915390dc7053b9421f735a723e7',
    GUSD: '0xbe9a62939f82e12f4a48912078a4420f1a5fc2e0',
    WBTC: '0x3e9c64afc24c551cc8e11f52fedecdacf7362559',
    PWXDAI: '0xf7270b6f75dc1f8b8efa003c0096a39c71f16f9b',
    PUSDC: '0xcb7c7b047f2f43e74ef40953f27e6a905711f2a8',
    PWETH: '0x6e675d67d6472a3b081f5ef22f90662645343843',
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
    PDAI: '0xccaac4ee88ac1939aebc8b5c64b25550361ff5dd',
    PUSDC: '0xed7497bb13f527f3a7306c4b5c721993b98e386c',
    PWETH: '0x6f36db785ae66c6072883015a375d76341e36d11',
  },
  [CHAIN_IDS.sepolia]: {
    POOL: '0x68a100a3729fc04ab26fb4c0862df22ceec2f18b',
    LINK: '0x779877a7b0d9e8603169ddbd7836e478b4624789',
  },
  [CHAIN_IDS.optimismSepolia]: {
    POOL: '0x858ee6f08f4c501fb6cb8d7c14b599caecbdf964',
    DAI: '0xfcb9742207f3f5aecda6c19277844bd6d477d494',
    USDC: '0x50db04090c1fee4bed694e13637881e4dd2177f3',
    WETH: '0x9b5a493d7aeb87583b392b599fb62e4e9e3aa7a9',
    GUSD: '0x449b806ebc00466dd1b4b62dc7d975c02514374c',
    WBTC: '0x4595dc675b99d17bd8ac0284d2a4e8456310267c',
    PDAI: '0x15908259161f52dff2a25f08ee4d32074ed563c8',
    PUSDC: '0x3a1a6a3fd893f1e302feb406148a6647b30f92a3',
    PWETH: '0x86d3b87a8b08d8f2747d5f72575d8e7a943370b6',
    PGUSD: '0xbdc33d890daa931c5656c972765dea18122be365',
    PWBTC: '0xd2b1c965374316a33d1808f4aedaf7320dd1b4f0',
  },
};

export const LIQUIDATION_TOKEN_ALLOW_LIST = {
  [CHAIN_IDS.mainnet]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.mainnet]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.optimism]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.optimism]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.gnosis]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.gnosis]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.world]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.world]).map((tokenAddress) =>
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
  [CHAIN_IDS.scroll]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.scroll]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.worldSepolia]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.worldSepolia]).map((tokenAddress) =>
      tokenAddress.toLowerCase(),
    ),
  ],
  [CHAIN_IDS.gnosisChiado]: [
    ...Object.values(KNOWN_TOKENS[CHAIN_IDS.gnosisChiado]).map((tokenAddress) =>
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
  [gnosisChiadoTokens.WXDAI.toLowerCase()]: mainnetTokens.DAI.toLowerCase(),

  [optimismSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(),
  [baseSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(),
  [scrollSepoliaTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(),
  [gnosisChiadoTokens.GUSD.toLowerCase()]: mainnetTokens.GUSD.toLowerCase(),
};
