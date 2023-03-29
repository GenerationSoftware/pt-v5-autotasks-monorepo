import { ContractsBlob } from "../types";
export declare const ETHEREUM_MAINNET_CHAIN_ID = 1;
export declare const ETHEREUM_GOERLI_CHAIN_ID = 5;
export declare const ETHEREUM_SEPOLIA_CHAIN_ID = 11155111;
export declare const ETHEREUM_MAINNET_CHAIN_IDS: number[];
export declare const TESTNET_CHAIN_IDS: number[];
export declare const isMainnet: (chainId: number) => boolean;
export declare const isTestnet: (chainId: number) => boolean;
export declare const getContracts: (
  chainId: number,
  mainnet: ContractsBlob,
  testnet: ContractsBlob
) => ContractsBlob;
