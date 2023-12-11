import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  runPrizeClaimer,
  PrizeClaimerConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';

export const executeTransactions = async (
  prizeClaimerConfigParams: PrizeClaimerConfigParams,
): Promise<void> => {
  try {
    const contracts: ContractsBlob = await downloadContractsBlob(prizeClaimerConfigParams.chainId);
    await runPrizeClaimer(contracts, prizeClaimerConfigParams);
  } catch (e) {
    console.error(e);
  }
};
