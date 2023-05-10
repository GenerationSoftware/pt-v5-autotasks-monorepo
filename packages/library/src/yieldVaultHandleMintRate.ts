import { PopulatedTransaction } from "@ethersproject/contracts";
import { getContracts } from "@pooltogether/v5-utils-js";

import { ContractsBlob } from "./types";

export async function yieldVaultHandleMintRate(
  contracts: ContractsBlob,
  params
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, writeProvider } = params;

  const yieldVaults = getContracts("YieldVault", chainId, writeProvider, contracts);

  let transactionsPopulated: PopulatedTransaction[] | undefined = [];
  for (const yieldVault of yieldVaults) {
    if (!yieldVault) {
      throw new Error("YieldVault: Contract Unavailable");
    }

    console.log("YieldVault: mintRate()");

    transactionsPopulated.push(await yieldVault.populateTransaction.mintRate());
  }

  return transactionsPopulated;
}
