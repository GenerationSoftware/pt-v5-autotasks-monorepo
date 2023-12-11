import { Relay, RelayConfig } from '@generationsoftware/pt-v5-autotasks-library';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { ethers } from 'ethers';

// This sets up each relay config with a Relay object containing it's contracts,
// relayerAccount, read and write providers and chainId
export const getRelays = async (relayConfigs: RelayConfig[]): Promise<Relay[]> => {
  let relays: Relay[] = [];

  for (const relayConfig of Object.values(relayConfigs)) {
    const chainId = Number(relayConfig.RELAY_CHAIN_ID);

    const readProvider = new ethers.providers.JsonRpcProvider(
      relayConfig.RELAY_JSON_RPC_URI,
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
