import { ContractsBlob } from './types';

import { ClaimerAbi } from './abis/claimerAbi';
import { PrizePoolAbi } from './abis/prizePoolAbi';
import { YieldVaultAbi } from './abis/yieldVaultAbi';

// 20230322134729
// https://raw.githubusercontent.com/pooltogether/v5-testnet/a54e5503bd7133bc3518294dffdb68234802d09b/testnet-contracts.json

export const testnetContractsBlob: ContractsBlob = {
  // name: 'Hyperstructure Testnet',
  // version: {
  //   major: 1,
  //   minor: 0,
  //   patch: 0,
  // },
  contracts: [
    {
      abi: [],
      chainId: 5,
      address: '0x354E47B9f58BA53b47C96D77d5AF89f8a945347D',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'MarketRate',
    },
    {
      abi: [],
      chainId: 5,
      address: '0xF8c8613BF1d4bF3829C6A2F808168Ea1Aa636097',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'TokenFaucet',
    },
    {
      abi: [],
      chainId: 5,
      address: '0x448200d83e48f561B42e90274566d3FA3914B8A4',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'TwabController',
    },
    {
      abi: [],
      chainId: 5,
      address: '0xFfF6e20deb5cC0E66Bc697eB779f7a884ecFaB5d',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'ERC20Mintable',
    },
    {
      abi: PrizePoolAbi,
      chainId: 5,
      address: '0x29A2C67a6F3bEF9c77B59B135E528d8A49b9b1F1',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'PrizePool',
    },
    {
      abi: ClaimerAbi,
      chainId: 5,
      address: '0xe99c7c06CE3D2291474e3cD5ba777626476DAb5E',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'Claimer',
    },
    {
      abi: [],
      chainId: 5,
      address: '0x01AA21a8228Be82632202F96f0d556Bc33Db2ec6',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationPairFactory',
    },
    {
      abi: [],
      chainId: 5,
      address: '0xa5f3642583990745Af4a647e1818428f49584b01',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationRouter',
    },
    {
      abi: [],
      chainId: 5,
      address: '0x56159f593155E3079A2d0Ae253e97C703dBe54A8',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'ERC20Mintable',
    },
    {
      abi: YieldVaultAbi,
      chainId: 5,
      address: '0x7FEB45eE6d652c716CBed040e68c6ba59B6141f1',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'YieldVault',
    },
    {
      abi: [],
      chainId: 5,
      address: '0x4DFCDaFCc71228bAb8F1e4E95D7FaD360a6FaDB4',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'Vault',
    },
    {
      abi: [],
      chainId: 5,
      address: '0x7B348B243b205C4666F6eAffB53dC95Eb7e97b57',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationPair',
    },
  ],
};
