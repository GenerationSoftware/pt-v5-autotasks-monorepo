import { RelayerParams } from 'defender-relay-client';
import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  executeDrawAuctionTxs,
  Relay,
  DrawAuctionConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import { Relayer } from 'defender-relay-client';
import { getRelays } from './relays';

export const executeTransactions = async (
  rngEvent: RelayerParams,
  params: DrawAuctionConfigParams,
  signer,
  relayConfig,
): Promise<void> => {
  const rngRelayer = new Relayer(rngEvent);

  try {
    const rngContracts = await downloadContractsBlob(params.rngChainId);

    const relays: Relay[] = await getRelays(relayConfig);

    await executeDrawAuctionTxs(rngContracts, rngRelayer, params, relays, signer);
  } catch (e) {
    console.error(e);
  }
};
