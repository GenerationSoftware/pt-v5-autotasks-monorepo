import { Relayer } from 'defender-relay-client';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import { Relay, RelayConfig } from '@generationsoftware/pt-v5-autotasks-library';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { ethers } from 'ethers';

export const getRelays = async (relayConfigs: RelayConfig[]) => {
  let relays: Relay[] = [];

  for (const relayConfig of Object.values(relayConfigs)) {
    console.log(relayConfig);

    const chainId = Number(relayConfig.RELAY_CHAIN_ID);

    const readProvider = new ethers.providers.JsonRpcProvider(
      relayConfig.RELAY_JSON_RPC_URI,
      chainId,
    );

    const relayChainFakeEvent = {
      apiKey: relayConfig.RELAY_RELAYER_API_KEY,
      apiSecret: relayConfig.RELAY_RELAYER_API_SECRET,
    };
    const writeProvider = new DefenderRelayProvider(relayChainFakeEvent);
    const relayer = new Relayer(relayChainFakeEvent);

    const contracts: ContractsBlob = await downloadContractsBlob(chainId);

    relays.push({
      chainId,
      contracts,
      relayer,
      readProvider,
      writeProvider,
    });
  }
  console.log('relays');
  console.log(relays);

  return relays;
};
