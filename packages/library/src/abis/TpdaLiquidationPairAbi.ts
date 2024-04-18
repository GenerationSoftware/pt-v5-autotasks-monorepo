export const TpdaLiquidationPairAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_source',
        type: 'address',
        internalType: 'contract ILiquidationSource',
      },
      {
        name: '__tokenIn',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '__tokenOut',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_targetAuctionPeriod',
        type: 'uint64',
        internalType: 'uint64',
      },
      {
        name: '_targetAuctionPrice',
        type: 'uint192',
        internalType: 'uint192',
      },
      {
        name: '_smoothingFactor',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'computeExactAmountIn',
    inputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'computeTimeForPrice',
    inputs: [
      {
        name: 'price',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'lastAuctionAt',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint64',
        internalType: 'uint64',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'lastAuctionPrice',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint192',
        internalType: 'uint192',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'maxAmountOut',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'smoothingFactor',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'source',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'contract ILiquidationSource',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'swapExactAmountOut',
    inputs: [
      {
        name: '_receiver',
        type: 'address',
        internalType: 'address',
      },
      {
        name: '_amountOut',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_amountInMax',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: '_flashSwapData',
        type: 'bytes',
        internalType: 'bytes',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'target',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'targetAuctionPeriod',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenIn',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenOut',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'address',
        internalType: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'SwappedExactAmountOut',
    inputs: [
      {
        name: 'sender',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'receiver',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'amountOut',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'amountInMax',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'amountIn',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'flashSwapData',
        type: 'bytes',
        indexed: false,
        internalType: 'bytes',
      },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'InsufficientBalance',
    inputs: [
      {
        name: 'requested',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'available',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
  {
    type: 'error',
    name: 'ReceiverIsZero',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SmoothingGteOne',
    inputs: [],
  },
  {
    type: 'error',
    name: 'SwapExceedsMax',
    inputs: [
      {
        name: 'amountInMax',
        type: 'uint256',
        internalType: 'uint256',
      },
      {
        name: 'amountIn',
        type: 'uint256',
        internalType: 'uint256',
      },
    ],
  },
];
