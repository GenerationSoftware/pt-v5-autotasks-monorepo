import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { DrawAuctionConfigParams } from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';

const handlerLoadParams = (
  relayerAddress: string,
  rngWriteProvider: DefenderRelayProvider,
  relayWriteProvider: DefenderRelayProvider,
): DrawAuctionConfigParams => {
  return {
    rngChainId: Number(BUILD_CHAIN_ID),
    relayChainId: Number(BUILD_RELAY_CHAIN_ID),
    relayerAddress,
    rngReadProvider: new ethers.providers.JsonRpcProvider(
      BUILD_JSON_RPC_URI,
      Number(BUILD_CHAIN_ID),
    ),
    rngWriteProvider,
    relayReadProvider: new ethers.providers.JsonRpcProvider(
      BUILD_RELAY_JSON_RPC_URI,
      Number(BUILD_RELAY_CHAIN_ID),
    ),
    relayWriteProvider,
    covalentApiKey: BUILD_COVALENT_API_KEY,
    rewardRecipient: BUILD_REWARD_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };
};

export async function handler(event: RelayerParams) {
  const rngWriteProvider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, rngWriteProvider, {
    speed: 'fast',
  });
  const relayerAddress = await signer.getAddress();

  const relayChainFakeEvent = {
    apiKey: BUILD_RELAY_RELAYER_API_KEY,
    apiSecret: BUILD_RELAY_RELAYER_API_SECRET,
  };
  const relayWriteProvider = new DefenderRelayProvider(event);

  const params = handlerLoadParams(relayerAddress, rngWriteProvider, relayWriteProvider);

  await executeTransactions(event, relayChainFakeEvent, params, signer);
}
