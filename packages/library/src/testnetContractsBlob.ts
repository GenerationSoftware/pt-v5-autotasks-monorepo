import { ContractsBlob } from './types';

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
      abi: [
        {
          inputs: [
            {
              internalType: 'contract IERC20',
              name: '_prizeToken',
              type: 'address',
            },
            {
              internalType: 'contract TwabController',
              name: '_twabController',
              type: 'address',
            },
            {
              internalType: 'uint32',
              name: '_grandPrizePeriodDraws',
              type: 'uint32',
            },
            {
              internalType: 'uint32',
              name: '_drawPeriodSeconds',
              type: 'uint32',
            },
            {
              internalType: 'uint64',
              name: 'nextDrawStartsAt_',
              type: 'uint64',
            },
            {
              internalType: 'uint8',
              name: '_numberOfTiers',
              type: 'uint8',
            },
            {
              internalType: 'uint96',
              name: '_tierShares',
              type: 'uint96',
            },
            {
              internalType: 'uint96',
              name: '_canaryShares',
              type: 'uint96',
            },
            {
              internalType: 'uint96',
              name: '_reserveShares',
              type: 'uint96',
            },
            {
              internalType: 'UD2x18',
              name: '_claimExpansionThreshold',
              type: 'uint64',
            },
            {
              internalType: 'SD1x18',
              name: '_alpha',
              type: 'int64',
            },
          ],
          stateMutability: 'nonpayable',
          type: 'constructor',
        },
        {
          inputs: [
            {
              internalType: 'uint256',
              name: 'x',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'y',
              type: 'uint256',
            },
          ],
          name: 'PRBMath_MulDiv18_Overflow',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'uint256',
              name: 'x',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'y',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'denominator',
              type: 'uint256',
            },
          ],
          name: 'PRBMath_MulDiv_Overflow',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'SD59x18',
              name: 'x',
              type: 'int256',
            },
          ],
          name: 'PRBMath_SD59x18_Ceil_Overflow',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'int256',
              name: 'x',
              type: 'int256',
            },
          ],
          name: 'PRBMath_SD59x18_Convert_Overflow',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'int256',
              name: 'x',
              type: 'int256',
            },
          ],
          name: 'PRBMath_SD59x18_Convert_Underflow',
          type: 'error',
        },
        {
          inputs: [],
          name: 'PRBMath_SD59x18_Div_InputTooSmall',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'SD59x18',
              name: 'x',
              type: 'int256',
            },
            {
              internalType: 'SD59x18',
              name: 'y',
              type: 'int256',
            },
          ],
          name: 'PRBMath_SD59x18_Div_Overflow',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'SD59x18',
              name: 'x',
              type: 'int256',
            },
          ],
          name: 'PRBMath_SD59x18_Exp2_InputTooBig',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'SD59x18',
              name: 'x',
              type: 'int256',
            },
          ],
          name: 'PRBMath_SD59x18_Log_InputTooSmall',
          type: 'error',
        },
        {
          inputs: [],
          name: 'PRBMath_SD59x18_Mul_InputTooSmall',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'SD59x18',
              name: 'x',
              type: 'int256',
            },
            {
              internalType: 'SD59x18',
              name: 'y',
              type: 'int256',
            },
          ],
          name: 'PRBMath_SD59x18_Mul_Overflow',
          type: 'error',
        },
        {
          inputs: [
            {
              internalType: 'uint256',
              name: 'x',
              type: 'uint256',
            },
          ],
          name: 'PRBMath_UD60x18_Convert_Overflow',
          type: 'error',
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: 'uint32',
              name: 'drawId',
              type: 'uint32',
            },
            {
              indexed: true,
              internalType: 'address',
              name: 'vault',
              type: 'address',
            },
            {
              indexed: true,
              internalType: 'address',
              name: 'winner',
              type: 'address',
            },
            {
              indexed: false,
              internalType: 'uint8',
              name: 'tier',
              type: 'uint8',
            },
            {
              indexed: false,
              internalType: 'uint152',
              name: 'payout',
              type: 'uint152',
            },
            {
              indexed: false,
              internalType: 'address',
              name: 'to',
              type: 'address',
            },
            {
              indexed: false,
              internalType: 'uint96',
              name: 'fee',
              type: 'uint96',
            },
            {
              indexed: false,
              internalType: 'address',
              name: 'feeRecipient',
              type: 'address',
            },
          ],
          name: 'ClaimedPrize',
          type: 'event',
        },
        {
          inputs: [],
          name: '_reserve',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: '_winningRandomNumber',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'alpha',
          outputs: [
            {
              internalType: 'SD1x18',
              name: '',
              type: 'int64',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint8',
              name: '_tier',
              type: 'uint8',
            },
          ],
          name: 'calculatePrizeSize',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint8',
              name: '_tier',
              type: 'uint8',
            },
          ],
          name: 'calculateTierTwabTimestamps',
          outputs: [
            {
              internalType: 'uint64',
              name: 'startTimestamp',
              type: 'uint64',
            },
            {
              internalType: 'uint64',
              name: 'endTimestamp',
              type: 'uint64',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'canaryClaimCount',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint8',
              name: '_numTiers',
              type: 'uint8',
            },
          ],
          name: 'canaryPrizeCount',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'canaryPrizeCount',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint8',
              name: 'numTiers',
              type: 'uint8',
            },
          ],
          name: 'canaryPrizeCountMultiplier',
          outputs: [
            {
              internalType: 'UD60x18',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'canaryShares',
          outputs: [
            {
              internalType: 'uint96',
              name: '',
              type: 'uint96',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'claimCount',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'claimExpansionThreshold',
          outputs: [
            {
              internalType: 'UD2x18',
              name: '',
              type: 'uint64',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: '_winner',
              type: 'address',
            },
            {
              internalType: 'uint8',
              name: '_tier',
              type: 'uint8',
            },
            {
              internalType: 'address',
              name: '_to',
              type: 'address',
            },
            {
              internalType: 'uint96',
              name: '_fee',
              type: 'uint96',
            },
            {
              internalType: 'address',
              name: '_feeRecipient',
              type: 'address',
            },
          ],
          name: 'claimPrize',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint256',
              name: 'winningRandomNumber_',
              type: 'uint256',
            },
          ],
          name: 'completeAndStartNextDraw',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: '_prizeVault',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: '_amount',
              type: 'uint256',
            },
          ],
          name: 'contributePrizeTokens',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [],
          name: 'drawPeriodSeconds',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint8',
              name: 'numTiers',
              type: 'uint8',
            },
          ],
          name: 'estimatedPrizeCount',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'estimatedPrizeCount',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: '_vault',
              type: 'address',
            },
            {
              internalType: 'uint32',
              name: '_startDrawIdInclusive',
              type: 'uint32',
            },
            {
              internalType: 'uint32',
              name: '_endDrawIdInclusive',
              type: 'uint32',
            },
          ],
          name: 'getContributedBetween',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'getLastCompletedDrawId',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'getNextDrawId',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint8',
              name: '_tier',
              type: 'uint8',
            },
          ],
          name: 'getTierAccrualDurationInDraws',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint8',
              name: '_tier',
              type: 'uint8',
            },
          ],
          name: 'getTierLiquidity',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint8',
              name: '_tier',
              type: 'uint8',
            },
          ],
          name: 'getTierPrizeCount',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'pure',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'uint32',
              name: '_startDrawIdInclusive',
              type: 'uint32',
            },
            {
              internalType: 'uint32',
              name: '_endDrawIdInclusive',
              type: 'uint32',
            },
          ],
          name: 'getTotalContributedBetween',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'getTotalShares',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: '_vault',
              type: 'address',
            },
            {
              internalType: 'uint32',
              name: 'startDrawId',
              type: 'uint32',
            },
            {
              internalType: 'uint32',
              name: 'endDrawId',
              type: 'uint32',
            },
          ],
          name: 'getVaultPortion',
          outputs: [
            {
              internalType: 'SD59x18',
              name: '',
              type: 'int256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: '_vault',
              type: 'address',
            },
            {
              internalType: 'address',
              name: '_user',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: '_drawDuration',
              type: 'uint256',
            },
          ],
          name: 'getVaultUserBalanceAndTotalSupplyTwab',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'getWinningRandomNumber',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'grandPrizePeriodDraws',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: '_vault',
              type: 'address',
            },
            {
              internalType: 'address',
              name: '_user',
              type: 'address',
            },
            {
              internalType: 'uint8',
              name: '_tier',
              type: 'uint8',
            },
          ],
          name: 'isWinner',
          outputs: [
            {
              internalType: 'bool',
              name: '',
              type: 'bool',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'largestTierClaimed',
          outputs: [
            {
              internalType: 'uint8',
              name: '',
              type: 'uint8',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'lastCompletedDrawId',
          outputs: [
            {
              internalType: 'uint32',
              name: '',
              type: 'uint32',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'lastCompletedDrawStartedAt',
          outputs: [
            {
              internalType: 'uint64',
              name: '',
              type: 'uint64',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'nextDrawEndsAt',
          outputs: [
            {
              internalType: 'uint64',
              name: '',
              type: 'uint64',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'nextDrawStartsAt',
          outputs: [
            {
              internalType: 'uint64',
              name: '',
              type: 'uint64',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'numberOfTiers',
          outputs: [
            {
              internalType: 'uint8',
              name: '',
              type: 'uint8',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'prizeToken',
          outputs: [
            {
              internalType: 'contract IERC20',
              name: '',
              type: 'address',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'prizeTokenPerShare',
          outputs: [
            {
              internalType: 'UD60x18',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'reserve',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'reserveShares',
          outputs: [
            {
              internalType: 'uint96',
              name: '',
              type: 'uint96',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'tierShares',
          outputs: [
            {
              internalType: 'uint96',
              name: '',
              type: 'uint96',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'totalDrawLiquidity',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'twabController',
          outputs: [
            {
              internalType: 'contract TwabController',
              name: '',
              type: 'address',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [
            {
              internalType: 'address',
              name: '_to',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: '_amount',
              type: 'uint256',
            },
          ],
          name: 'withdrawReserve',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
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
      abi: [],
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
      abi: [],
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
      abi: [],
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
      abi: [],
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
      abi: [],
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
      abi: [],
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
      abi: [],
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
