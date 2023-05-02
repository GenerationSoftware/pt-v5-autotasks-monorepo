import { ethers } from "ethers";
import { RelayerParams } from "defender-relay-client";
import {
  WithdrawClaimRewardsConfigParams,
  NETWORK_NAMES
} from "@pooltogether/v5-autotasks-library";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { populateTransaction, processPopulatedTransaction } from "./transactions";

const handlerLoadParams = (relayerAddress): WithdrawClaimRewardsConfigParams => {
  return { relayerAddress, chainId: Number(CHAIN_ID), rewardsRecipient: REWARDS_RECIPIENT };
};

export async function handler(event: RelayerParams) {
  console.clear();

  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const relayerAddress = await signer.getAddress();

  const params = handlerLoadParams(relayerAddress);
  console.log(params);

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[params.chainId],
    INFURA_API_KEY
  );

  const populatedTx = await populateTransaction(params, readProvider);

  processPopulatedTransaction(event, populatedTx);
}
