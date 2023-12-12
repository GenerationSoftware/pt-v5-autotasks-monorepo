import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  executeDrawAuctionTxs,
  Relay,
  DrawAuctionConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import { getRelays } from './getRelays';

export const executeTransactions = async (
  drawAuctionConfigParams: DrawAuctionConfigParams,
): Promise<void> => {
  try {
    const rngContracts = await downloadContractsBlob(drawAuctionConfigParams.chainId);

    const relays: Relay[] = await getRelays(drawAuctionConfigParams);

    await executeDrawAuctionTxs(rngContracts, drawAuctionConfigParams, relays);
  } catch (e) {
    console.error(e);
  }
};
