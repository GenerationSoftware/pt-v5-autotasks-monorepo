import { ethers } from "ethers";
import { RelayerParams } from "defender-relay-client";
import { WithdrawClaimRewardsConfigParams } from "@pooltogether/v5-autotasks-library";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { populateTransaction, processPopulatedTransaction } from "./transactions";

const handlerLoadParams = (relayerAddress): WithdrawClaimRewardsConfigParams => {
  return { relayerAddress, chainId: Number(BUILD_CHAIN_ID), rewardsRecipient: BUILD_REWARDS_RECIPIENT };
};

export async function handler(event: RelayerParams) {
  console.log("hello!");

  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const relayerAddress = await signer.getAddress();

  const params = handlerLoadParams(relayerAddress);
  console.log(params);

  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, BUILD_CHAIN_ID);

  const populatedTx = await populateTransaction(params, readProvider);
  console.log(populatedTx);

  await processPopulatedTransaction(event, populatedTx);
}
