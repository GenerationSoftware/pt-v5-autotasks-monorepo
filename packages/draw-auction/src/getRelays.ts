import { CHAIN_IDS, Relay, DrawAuctionConfig } from '@generationsoftware/pt-v5-autotasks-library';
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
export const getRelays = async (drawAuctionConfig: DrawAuctionConfig): Promise<Relay[]> => {
  let relays: Relay[] = [];

  for (const l2ChainId of drawAuctionConfig.relayChainIds) {
    const l2Provider = new ethers.providers.JsonRpcProvider(
      drawAuctionConfig[JSON_RPC_URI_KEYS[l2ChainId]],
      l2ChainId,
    );

    const contractsBlob: ContractsBlob = await downloadContractsBlob(l2ChainId);

    relays.push({
      l2ChainId,
      l2Provider,
      writeProvider: l2Provider,
      contractsBlob,
    });
  }

  return relays;
};
