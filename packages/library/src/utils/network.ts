import { ContractsBlob, ProviderUrlOptions, Secrets } from '../types';

// Mainnet chain ids
export const ETHEREUM_MAINNET_CHAIN_ID = 1;

// Testnet chain ids
export const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;

export const ETHEREUM_MAINNET_CHAIN_IDS = [
  ETHEREUM_MAINNET_CHAIN_ID,
];

export const TESTNET_CHAIN_IDS = [
  ETHEREUM_SEPOLIA_CHAIN_ID,
];

export const isMainnet = (chainId: number): boolean => {
  switch (chainId) {
    case ETHEREUM_MAINNET_CHAIN_ID:
      return true;
    default:
      return false;
  }
};

export const isTestnet = (chainId: number): boolean => {
  switch (chainId) {
    case ETHEREUM_SEPOLIA_CHAIN_ID:
      return true;
    default:
      return false;
  }
};

export const getContracts = (
  chainId: number,
  mainnet: ContractsBlob,
  testnet: ContractsBlob,
): ContractsBlob => {
  if (isMainnet(chainId)) {
    return mainnet;
  } else if (isTestnet(chainId)) {
    return testnet;
  } else {
    throw new Error(`getContracts: Unsupported network ${chainId}`);
  }
};
