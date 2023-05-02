import { ethers } from "ethers";
import { RelayerParams } from "defender-relay-client";
import { WithdrawClaimRewardsConfigParams, NETWORK_NAMES } from "v5-autotasks-library";

const handlerLoadParams = (): WithdrawClaimRewardsConfigParams => {
  return { chainId: Number(CHAIN_ID), rewardsRecipient: REWARDS_RECIPIENT };
};

export async function handler(event: RelayerParams) {
  console.clear();

  const params = handlerLoadParams();

  const readProvider = new ethers.providers.InfuraProvider(
    NETWORK_NAMES[params.chainId],
    INFURA_API_KEY
  );

  console.log("morework");
}
