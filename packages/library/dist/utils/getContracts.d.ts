import { ethers } from "ethers";
import { ContractsBlob } from "../types";
export declare function getContracts(
  name: string,
  chainId: number,
  providerOrSigner: any,
  contractsBlob: ContractsBlob,
  version?: {
    major: number;
    minor: number;
    patch: number;
  }
): ethers.Contract[];
