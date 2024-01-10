import nodeFetch from 'node-fetch';
import { ContractsBlob, downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  runFlashLiquidator,
  FlashLiquidatorConfig,
} from '@generationsoftware/pt-v5-autotasks-library';

export const executeTransactions = async (config: FlashLiquidatorConfig): Promise<void> => {
  try {
    const contracts: ContractsBlob = await downloadContractsBlob(config.chainId, nodeFetch);
    await runFlashLiquidator(contracts, config);
  } catch (error) {
    throw new Error(error);
  }
};
