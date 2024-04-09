import { loadEnvVars } from './index.js';
import { DrawAuctionEnvVars } from './../types.js';

export const loadDrawAuctionEnvVars = (): DrawAuctionEnvVars => {
  const envVars = loadEnvVars();

  const rewardRecipient = process.env.REWARD_RECIPIENT;

  return {
    ...envVars,
    REWARD_RECIPIENT: rewardRecipient,
  };
};
