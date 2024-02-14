import nodeFetch from 'node-fetch';
import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  runDrawAuction,
  Relay,
  DrawAuctionConfig,
} from '@generationsoftware/pt-v5-autotasks-library';
import { getRelays } from './getRelays';

export const executeTransactions = async (config: DrawAuctionConfig): Promise<void> => {
  try {
    const rngContracts = await downloadContractsBlob(
      config.l1ChainId,
      config.contractVersion,
      nodeFetch,
    );

    const relays: Relay[] = await getRelays(config);

    await runDrawAuction(rngContracts, config, relays);
  } catch (e) {
    console.error(e);
  }
};
