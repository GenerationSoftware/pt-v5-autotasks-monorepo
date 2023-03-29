import { PopulatedTransaction } from "@ethersproject/contracts";
import { ContractsBlob, ProviderOptions } from "./types";
export declare function liquidatorHandleArbSwap(
  contracts: ContractsBlob,
  config: ProviderOptions,
  swapRecipient: string,
  hello: string
): Promise<PopulatedTransaction | undefined>;
