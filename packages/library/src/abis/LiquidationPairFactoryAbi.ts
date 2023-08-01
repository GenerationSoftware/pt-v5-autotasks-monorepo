export const LiquidationPairFactoryAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'contract LiquidationPair',
        name: 'liquidator',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'contract ILiquidationSource',
        name: 'source',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'tokenIn',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'tokenOut',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'UFixed32x4',
        name: 'swapMultiplier',
        type: 'uint32',
      },
      {
        indexed: false,
        internalType: 'UFixed32x4',
        name: 'liquidityFraction',
        type: 'uint32',
      },
      {
        indexed: false,
        internalType: 'uint128',
        name: 'virtualReserveIn',
        type: 'uint128',
      },
      {
        indexed: false,
        internalType: 'uint128',
        name: 'virtualReserveOut',
        type: 'uint128',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'minK',
        type: 'uint256',
      },
    ],
    name: 'PairCreated',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'allPairs',
    outputs: [
      {
        internalType: 'contract LiquidationPair',
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
        internalType: 'contract ILiquidationSource',
        name: '_source',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_tokenIn',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_tokenOut',
        type: 'address',
      },
      {
        internalType: 'UFixed32x4',
        name: '_swapMultiplier',
        type: 'uint32',
      },
      {
        internalType: 'UFixed32x4',
        name: '_liquidityFraction',
        type: 'uint32',
      },
      {
        internalType: 'uint128',
        name: '_virtualReserveIn',
        type: 'uint128',
      },
      {
        internalType: 'uint128',
        name: '_virtualReserveOut',
        type: 'uint128',
      },
      {
        internalType: 'uint256',
        name: '_mink',
        type: 'uint256',
      },
    ],
    name: 'createPair',
    outputs: [
      {
        internalType: 'contract LiquidationPair',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract LiquidationPair',
        name: '',
        type: 'address',
      },
    ],
    name: 'deployedPairs',
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
    name: 'totalPairs',
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
];
