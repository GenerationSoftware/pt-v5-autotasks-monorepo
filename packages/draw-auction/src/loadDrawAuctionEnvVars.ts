import { DrawAuctionEnvVars, loadEnvVars } from '@generationsoftware/pt-v5-autotasks-library';

export const loadDrawAuctionEnvVars = (buildVars?, event?): DrawAuctionEnvVars => {
  const envVars = loadEnvVars(buildVars, event);

  const rewardRecipient = buildVars?.rewardRecipient || process.env.REWARD_RECIPIENT;

  return {
    ...envVars,
    REWARD_RECIPIENT: rewardRecipient,
  };
};
