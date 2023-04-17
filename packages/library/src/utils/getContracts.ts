import { ethers } from "ethers";
// import { Contract } from 'ethers';

// import {
//   ETHEREUM_MAINNET_CHAIN_ID,
//   ETHEREUM_GOERLI_CHAIN_ID,
//   ETHEREUM_SEPOLIA_CHAIN_ID,
// } from './network';
import { ContractsBlob } from "../types";

// const debug = require("debug")("pt-autotask-lib");

// Returns all the contracts that match the params by name, chain, and contract version
export function getContracts(
  name: string,
  chainId: number,
  providerOrSigner: any,
  contractsBlob: ContractsBlob,
  version = {
    major: 1,
    minor: 0,
    patch: 0,
  }
): ethers.Contract[] {
  // debug("name:", name);
  // debug("chainId:", chainId);

  if (!name || !chainId) throw new Error(`Invalid Contract Parameters`);

  const contracts = contractsBlob.contracts
    .filter((cont) => cont.type === name && cont.chainId === chainId)
    .filter((contract) => JSON.stringify(contract.version) === JSON.stringify(version));

  let contractsArray: ethers.Contract[] = [];

  for (const contract of contracts) {
    if (contract) {
      contractsArray.push(new ethers.Contract(contract.address, contract.abi, providerOrSigner));
    }
  }

  if (contractsArray.length === 0) {
    throw new Error(
      `Multiple Contracts Unavailable: ${name} on chainId: ${chainId}. Contract version: ${version.major}.${version.minor}.${version.patch}`
    );
  } else {
    return contractsArray;
  }
}
