import { PopulatedTransaction } from "@ethersproject/contracts";
import { ContractsBlob, ProviderOptions } from "./types";
export declare function claimerHandlePrizeClaim(contracts: ContractsBlob, config: ProviderOptions, feeRecipient: string): Promise<PopulatedTransaction[] | undefined>;
