import { loadEnvVars } from './index.js';
import { DrawAuctionEnvVars } from './../types.js';

export const loadDrawAuctionEnvVars = (buildVars?): DrawAuctionEnvVars => {
  const envVars = loadEnvVars(buildVars);

  const rewardRecipient = buildVars?.rewardRecipient || process.env.REWARD_RECIPIENT;

  return {
    ...envVars,
    REWARD_RECIPIENT: rewardRecipient,
  };
};
