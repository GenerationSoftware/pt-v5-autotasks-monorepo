// import { ethers } from 'ethers';
import { Contract } from "ethers";

import { getContracts } from "./getContracts";
import { ContractsBlob } from "../types";

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
  }
): Contract | undefined {
  return getContracts(name, chainId, providerOrSigner, contractsBlob, version)[0];
}
