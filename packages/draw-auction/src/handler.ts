import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { DrawAuctionConfigParams } from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';

const handlerLoadParams = (
  relayerAddress: string,
  rngWriteProvider: DefenderRelayProvider,
): DrawAuctionConfigParams => {
  return {
    rngChainId: Number(BUILD_CHAIN_ID),
    relayerAddress,
    rngReadProvider: new ethers.providers.JsonRpcProvider(
      BUILD_JSON_RPC_URI,
      Number(BUILD_CHAIN_ID),
    ),
    rngWriteProvider,
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

  const params = handlerLoadParams(relayerAddress, rngWriteProvider);

  await executeTransactions(event, params, signer, BUILD_RELAYS);
}
