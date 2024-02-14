import nodeFetch from 'node-fetch';
import { ContractsBlob, downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { runLiquidator, LiquidatorConfig } from '@generationsoftware/pt-v5-autotasks-library';

export const executeTransactions = async (config: LiquidatorConfig): Promise<void> => {
  try {
    const contracts: ContractsBlob = await downloadContractsBlob(
      config.chainId,
      config.contractVersion,
      nodeFetch,
    );
    await runLiquidator(contracts, config);
  } catch (error) {
    throw new Error(error);
  }
};
