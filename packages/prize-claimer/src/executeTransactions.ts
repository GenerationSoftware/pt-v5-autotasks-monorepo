import nodeFetch from 'node-fetch';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { runPrizeClaimer, PrizeClaimerConfig } from '@generationsoftware/pt-v5-autotasks-library';

export const executeTransactions = async (config: PrizeClaimerConfig): Promise<void> => {
  try {
    const contracts: ContractsBlob = await downloadContractsBlob(
      config.chainId,
      config.contractVersion,
      nodeFetch,
    );
    await runPrizeClaimer(contracts, config);
  } catch (e) {
    console.error(e);
  }
};
