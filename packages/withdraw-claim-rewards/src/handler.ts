import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import { WithdrawClaimRewardsConfigParams } from '@generationsoftware/pt-v5-autotasks-library';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

import { populateTransaction, processPopulatedTransaction } from './transactions';

const handlerLoadParams = (relayerAddress): WithdrawClaimRewardsConfigParams => {
  return {
    chainId: Number(BUILD_CHAIN_ID),
    relayerAddress,
    rewardsRecipient: BUILD_REWARDS_RECIPIENT,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };
};

export async function handler(event: RelayerParams) {
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: 'fast' });
  const relayerAddress = await signer.getAddress();

  const params = handlerLoadParams(relayerAddress);
  console.log(params);

  const chainId = Number(BUILD_CHAIN_ID);
  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, chainId);

  const populatedTx = await populateTransaction(params, readProvider);

  await processPopulatedTransaction(event, populatedTx);
}
