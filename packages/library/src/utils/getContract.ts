// import { ethers } from 'ethers';
import { Contract } from 'ethers';

import { getContracts } from './getContracts';

// import {
//   ETHEREUM_MAINNET_CHAIN_ID,
//   ETHEREUM_GOERLI_CHAIN_ID,
//   ETHEREUM_SEPOLIA_CHAIN_ID,
// } from './network';
import { ContractsBlob } from '../types';

const debug = require('debug')('pt-autotask-lib');

// Returns the first contract that matches the params by name, chain, and contract version
export function getContract(
  name: string,
  chainId: number,
  providerOrSigner: any,
  contractsBlob: ContractsBlob,
  version = {
    major: 1,
    minor: 0,
    patch: 0,
  },
): Contract | undefined {
  return getContracts(name, chainId, providerOrSigner, contractsBlob, version)[0];
}
