import { ethers, Wallet } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { DrawAuctionConfigParams } from '@generationsoftware/pt-v5-autotasks-library';
import { Relayer } from 'defender-relay-client';

import { executeTransactions } from './transactions';

const handlerLoadParams = (rngRelayerAddress: string): DrawAuctionConfigParams => {
  return {
    rngChainId: Number(BUILD_CHAIN_ID),
    rngRelayerAddress,
    rngReadProvider: new ethers.providers.JsonRpcProvider(
      BUILD_JSON_RPC_URI,
      Number(BUILD_CHAIN_ID),
    ),
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
  const rngRelayerAddress = await signer.getAddress();

  const params = handlerLoadParams(rngRelayerAddress);

  let rngRelayer: Relayer | Wallet;
  if (BUILD_CUSTOM_RELAYER_PRIVATE_KEY) {
    const wallet = new Wallet(BUILD_CUSTOM_RELAYER_PRIVATE_KEY);
    rngRelayer = wallet;
  } else {
    rngRelayer = new Relayer(event);
  }

  await executeTransactions(rngRelayer, params, signer, BUILD_RELAYS);
}
