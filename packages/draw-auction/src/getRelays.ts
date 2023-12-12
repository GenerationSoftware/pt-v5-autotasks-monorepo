import {
  CHAIN_IDS,
  Relay,
  DrawAuctionConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { ethers } from 'ethers';

export const JSON_RPC_URI_KEYS = {
  [CHAIN_IDS.optimism]: 'optimismRelayJsonRpcUri',
  [CHAIN_IDS.arbitrum]: 'arbitrumRelayJsonRpcUri',
  [CHAIN_IDS.optimismSepolia]: 'optimismSepoliaRelayJsonRpcUri',
  [CHAIN_IDS.arbitrumSepolia]: 'arbitrumSepoliaRelayJsonRpcUri',
};

// This sets up each relay chain with a object of type 'Relay', containing it's contracts,
// relayerAccount, read and write providers and chainId
export const getRelays = async (
  drawAuctionConfigParams: DrawAuctionConfigParams,
): Promise<Relay[]> => {
  let relays: Relay[] = [];

  for (const chainId of drawAuctionConfigParams.relayChainIds) {
    const readProvider = new ethers.providers.JsonRpcProvider(
      drawAuctionConfigParams[JSON_RPC_URI_KEYS[chainId]],
      chainId,
    );

    const contractsBlob: ContractsBlob = await downloadContractsBlob(chainId);

    relays.push({
      chainId,
      contractsBlob,
      readProvider,
      writeProvider: readProvider,
    });
  }

  return relays;
};
