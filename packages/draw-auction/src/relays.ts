import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import {
  Relay,
  RelayConfig,
  RelayerAccount,
  instantiateRelayAccount,
} from '@generationsoftware/pt-v5-autotasks-library';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { ethers } from 'ethers';

// This sets up each relay config with a Relay object containing it's contracts,
// RelayerAccount, read and write providers and chainId
export const getRelays = async (relayConfigs: RelayConfig[]): Promise<Relay[]> => {
  let relays: Relay[] = [];

  for (const relayConfig of Object.values(relayConfigs)) {
    const chainId = Number(relayConfig.RELAY_CHAIN_ID);

    const mockEvent = {
      apiKey: relayConfig.RELAY_RELAYER_API_KEY,
      apiSecret: relayConfig.RELAY_RELAYER_API_SECRET,
    };

    const writeProvider = new DefenderRelayProvider(mockEvent);
    const readProvider = new ethers.providers.JsonRpcProvider(
      relayConfig.RELAY_JSON_RPC_URI,
      chainId,
    );

    const relayerAccount: RelayerAccount = await instantiateRelayAccount(
      writeProvider,
      readProvider,
      mockEvent,
      relayConfig.RELAY_CUSTOM_RELAYER_PRIVATE_KEY,
    );

    const contractsBlob: ContractsBlob = await downloadContractsBlob(chainId);

    relays.push({
      chainId,
      contractsBlob,
      relayerAccount,
      readProvider,
      writeProvider,
    });
  }

  return relays;
};
