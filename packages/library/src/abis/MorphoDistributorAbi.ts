export const MorphoDistributorAbi = [
  {
    name: 'claim',
    outputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'address', name: 'reward', type: 'address' },
      { internalType: 'uint256', name: 'claimable', type: 'uint256' },
      { internalType: 'bytes32[]', name: 'proof', type: 'bytes32[]' },
    ],
  },
];
