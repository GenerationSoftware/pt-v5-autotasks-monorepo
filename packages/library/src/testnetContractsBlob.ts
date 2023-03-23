import { ContractsBlob } from './types';

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
      abi: [],
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
      address: '0xEF25345A1bE04D49520fA57518a426056159B555',
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
    {
      abi: YieldVaultAbi,
      chainId: 5,
      address: '0x30788E4Bb6d37C8C8EddEF858c46229921865648',
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
      address: '0xcfda8A87481eC851c7dC5Cf23582EDe0C9a7A35b',
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
      address: '0x87BeeD65Cedb8D2710ef12CF51742463acccf597',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationPair',
    },
    {
      abi: [],
      chainId: 5,
      address: '0x346ca12Ac254b843879733b17c6ed3d9c53333f0',
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
      address: '0x327e4D840799a7B0157270e8d8e32362Dae792d0',
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
      address: '0x86AAF4df222DD89067D228D325B643c4Da000860',
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
      address: '0x6c37c9Bf75D6E96258363C32057BDAE6a558Eb95',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationPair',
    },
    {
      abi: YieldVaultAbi,
      chainId: 5,
      address: '0x7Bb0a73264A73c14DdAa1b324687C48b46bfdd60',
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
      address: '0xF07E44AFcACAF8D1307EF5A2405659a3e07B05A0',
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
      address: '0x4bf32C3b5ffb6c57e29C31F3A3B4Ac04c586E4B3',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationPair',
    },
    {
      abi: [],
      chainId: 5,
      address: '0xD13905EF313F0F8cd0855E25c566354A2b7b9780',
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
      address: '0x54BaF9280727660FF8D5D1Ae3243152b69d8dcEf',
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
      address: '0x76196827f50E179fdC23898d3637F7a8b88E8116',
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
      address: '0xc87A97b86f37e4cfE85Ec61D94280664b9534F73',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationPair',
    },
    {
      abi: [],
      chainId: 5,
      address: '0xF33e8157569e09a9090E058b0a6D685d394258ed',
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
      address: '0x7CdD73150f8BeAB888905287aD9005Bfa42e9AC4',
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
      address: '0xE1B3ec5885148F6F2379Ede684916c8F68aB129D',
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
      address: '0x48AA1C46aF6C026a863Eb9c59948725102Dc70Ef',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationPair',
    },
    {
      abi: [],
      chainId: 5,
      address: '0x0a30769C05876521B79d61669513129aBeeF5B84',
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
      address: '0x4a65D8f6b7F2Cb2be6941012a948726A16a13421',
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
      address: '0xbA3cFE4d6AbfED02044d14F876d07722E967Ec74',
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
      address: '0xd1B1e2b62EB8Ed3334B6d3F4AF872e5D3257d40E',
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
      type: 'LiquidationPair',
    },
  ],
};
