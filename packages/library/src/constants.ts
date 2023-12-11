import { CHAIN_IDS } from './utils/network';

export const ERC_5164_MESSAGE_DISPATCHER_ADDRESS = {
  [CHAIN_IDS.optimism]: '0x2A34E6cae749876FB8952aD7d2fA486b00F0683F', // mainnet -> optimism
  [CHAIN_IDS.optimismGoerli]: '0x177B14c6b571262057C3c30E3AE6bB044F62e55c', // goerli -> optimism goerli
  [CHAIN_IDS.optimismSepolia]: '0x2aeB429f7d8c00983E033087Dd5a363AbA2AC55f', // sepolia -> optimism sepolia
  // [CHAIN_IDS.arbitrum]: '', // mainnet -> arbitrum
  [CHAIN_IDS.arbitrumGoerli]: '0xBc244773f71a2f897fAB5D5953AA052B8ff68670', // goerli -> arbitrum goerli
  [CHAIN_IDS.arbitrumSepolia]: '0x9887b04Fdf205Fef072d6F325c247264eD34ACF0', // sepolia -> arbitrum sepolia
};

export const ERC_5164_MESSAGE_EXECUTOR_ADDRESS = {
  [CHAIN_IDS.optimism]: '0x139f6dD114a9C45Ba43eE22C5e03c53de0c13225', // mainnet -> optimism
  [CHAIN_IDS.optimismSepolia]: '0x6A501383A61ebFBc143Fc4BD41A2356bA71A6964', // sepolia -> optimism sepolia
  [CHAIN_IDS.arbitrumSepolia]: '0x2B3E6b5c9a6Bdb0e595896C9093fce013490abbD', // sepolia -> arbitrum sepolia
};

export const RNG_AUCTION_RELAYER_REMOTE_OWNER_ADDRESS = {
  [CHAIN_IDS.optimism]: '0xEC9460c59cCA1299b0242D6AF426c21223ccCD24', // mainnet -> optimism
  [CHAIN_IDS.optimismGoerli]: '', // goerli -> optimism goerli
  [CHAIN_IDS.optimismSepolia]: '0x48cdb9fe4F71D9b6f17D8e4d72E4036931601BdE', // sepolia -> optimism sepolia
  [CHAIN_IDS.arbitrum]: '', // mainnet -> arbitrum
  [CHAIN_IDS.arbitrumGoerli]: '', // goerli -> arbitrum goerli
  [CHAIN_IDS.arbitrumSepolia]: '0xAFD0a893845cb2c278D6629c78fFA7ad403077Bf', // sepolia -> arbitrum sepolia
};
