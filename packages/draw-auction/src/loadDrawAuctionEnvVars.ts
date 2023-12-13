import { DrawAuctionEnvVars, loadEnvVars } from '@generationsoftware/pt-v5-autotasks-library';

export const loadDrawAuctionEnvVars = (buildVars?, event?): DrawAuctionEnvVars => {
  const envVars = loadEnvVars(buildVars, event);

  const rewardRecipient = buildVars?.rewardRecipient || process.env.REWARD_RECIPIENT;
  const relayChainIds = buildVars?.relayChainIds || process.env.RELAY_CHAIN_IDS;

  return {
    ...envVars,
    REWARD_RECIPIENT: rewardRecipient,
    RELAY_CHAIN_IDS: relayChainIds.split(',').map((chainId) => Number(chainId)),
  };
};
