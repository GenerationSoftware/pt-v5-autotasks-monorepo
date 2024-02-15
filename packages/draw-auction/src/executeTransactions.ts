import nodeFetch from 'node-fetch';
import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  runDrawAuction,
  Relay,
  DrawAuctionConfig,
} from '@generationsoftware/pt-v5-autotasks-library';

export const executeTransactions = async (config: DrawAuctionConfig): Promise<void> => {
  try {
    const rngContracts = await downloadContractsBlob(
      config.chainId,
      config.contractVersion,
      nodeFetch,
    );

    await runDrawAuction(rngContracts, config);
  } catch (e) {
    console.error(e);
  }
};
