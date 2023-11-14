import { CHAIN_IDS } from './utils/network';

export const ERC_5164_MESSAGE_DISPATCHER_ADDRESS = {
  [CHAIN_IDS.optimism]: '0x2A34E6cae749876FB8952aD7d2fA486b00F0683F', // mainnet -> optimism
  [CHAIN_IDS.optimismGoerli]: '0x177B14c6b571262057C3c30E3AE6bB044F62e55c', // goerli -> optimism goerli
  [CHAIN_IDS.optimismSepolia]: '0x2aeB429f7d8c00983E033087Dd5a363AbA2AC55f', // sepolia -> optimism sepolia
  // [CHAIN_IDS.arbitrum]: '', // mainnet -> arbitrum
  [CHAIN_IDS.arbitrumGoerli]: '0xBc244773f71a2f897fAB5D5953AA052B8ff68670', // goerli -> arbitrum goerli
  [CHAIN_IDS.arbitrumSepolia]: '0x8bCDe547B30C6DE6b532073F2d091F8B292D60a6', // sepolia -> arbitrum sepolia
};

export const ERC_5164_MESSAGE_EXECUTOR_ADDRESS = {
  [CHAIN_IDS.optimism]: '0x139f6dD114a9C45Ba43eE22C5e03c53de0c13225', // mainnet -> optimism
  [CHAIN_IDS.optimismSepolia]: '0x6A501383A61ebFBc143Fc4BD41A2356bA71A6964', // sepolia -> optimism sepolia
  [CHAIN_IDS.arbitrumSepolia]: '0x02aCC9594161812E3004C174CF1735EdB10e20A4', // sepolia -> arbitrum sepolia
};

export const ERC_5164_GREETER_ADDRESS = {
  [CHAIN_IDS.optimismSepolia]: '0x8537C5a9AAd3ec1D31a84e94d19FcFC681E83ED0',
  [CHAIN_IDS.arbitrumSepolia]: '0x49b86ba45C01957Df33Fe7bbB97002A0e4E5F964',
};

export const RNG_AUCTION_RELAYER_REMOTE_OWNER_ADDRESS = {
  [CHAIN_IDS.optimism]: '0xEC9460c59cCA1299b0242D6AF426c21223ccCD24', // mainnet -> optimism
  [CHAIN_IDS.optimismGoerli]: '', // goerli -> optimism goerli
  [CHAIN_IDS.optimismSepolia]: '0x48cdb9fe4F71D9b6f17D8e4d72E4036931601BdE', // sepolia -> optimism sepolia
  [CHAIN_IDS.arbitrum]: '', // mainnet -> arbitrum
  [CHAIN_IDS.arbitrumGoerli]: '', // goerli -> arbitrum goerli
  [CHAIN_IDS.arbitrumSepolia]: '0x149e3B3Bd69f1Cfc1B42b6A6a152a42E38cEeBf1', // sepolia -> arbitrum sepolia
};