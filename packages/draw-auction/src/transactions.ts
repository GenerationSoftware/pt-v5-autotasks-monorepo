import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  executeDrawAuctionTxs,
  Relay,
  DrawAuctionConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import { getRelays } from './relays';

export const executeTransactions = async (
  drawAuctionConfigParams: DrawAuctionConfigParams,
  relayConfig,
): Promise<void> => {
  try {
    const rngContracts = await downloadContractsBlob(drawAuctionConfigParams.rngChainId);

    const relays: Relay[] = await getRelays(relayConfig);

    await executeDrawAuctionTxs(rngContracts, drawAuctionConfigParams, relays);
  } catch (e) {
    console.error(e);
  }
};
