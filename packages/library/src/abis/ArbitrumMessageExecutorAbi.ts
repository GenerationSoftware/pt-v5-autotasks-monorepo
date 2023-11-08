export const arbitrumMessageExecutorAbi = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'messageId', type: 'bytes32' },
      { internalType: 'uint256', name: 'messageIndex', type: 'uint256' },
      { internalType: 'bytes', name: 'errorData', type: 'bytes' },
    ],
    name: 'MessageBatchFailure',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'messageId', type: 'bytes32' },
      { internalType: 'bytes', name: 'errorData', type: 'bytes' },
    ],
    name: 'MessageFailure',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'messageId', type: 'bytes32' }],
    name: 'MessageIdAlreadyExecuted',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'fromChainId', type: 'uint256' },
      { indexed: true, internalType: 'bytes32', name: 'messageId', type: 'bytes32' },
    ],
    name: 'MessageIdExecuted',
    type: 'event',
  },
  {
    inputs: [],
    name: 'dispatcher',
    outputs: [{ internalType: 'contract IMessageDispatcher', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_to', type: 'address' },
      { internalType: 'bytes', name: '_data', type: 'bytes' },
      { internalType: 'bytes32', name: '_messageId', type: 'bytes32' },
      { internalType: 'uint256', name: '_fromChainId', type: 'uint256' },
      { internalType: 'address', name: '_from', type: 'address' },
    ],
    name: 'executeMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        internalType: 'struct MessageLib.Message[]',
        name: '_messages',
        type: 'tuple[]',
      },
      { internalType: 'bytes32', name: '_messageId', type: 'bytes32' },
      { internalType: 'uint256', name: '_fromChainId', type: 'uint256' },
      { internalType: 'address', name: '_from', type: 'address' },
    ],
    name: 'executeMessageBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'executed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IMessageDispatcher',
        name: '_dispatcher',
        type: 'address',
      },
    ],
    name: 'setDispatcher',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
