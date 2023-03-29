import { Contract } from "ethers";
import { ContractsBlob } from "../types";
export declare function getContract(name: string, chainId: number, providerOrSigner: any, contractsBlob: ContractsBlob, version?: {
    major: number;
    minor: number;
    patch: number;
}): Contract | undefined;
