import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  executeDrawAuctionTxs,
  Relay,
  DrawAuctionConfig,
} from '@generationsoftware/pt-v5-autotasks-library';
import { getRelays } from './getRelays';

export const executeTransactions = async (drawAuctionConfig: DrawAuctionConfig): Promise<void> => {
  try {
    const rngContracts = await downloadContractsBlob(drawAuctionConfig.l1ChainId);

    const relays: Relay[] = await getRelays(drawAuctionConfig);

    await executeDrawAuctionTxs(rngContracts, drawAuctionConfig, relays);
  } catch (e) {
    console.error(e);
  }
};
