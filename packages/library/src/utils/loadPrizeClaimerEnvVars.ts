import { loadEnvVars } from './index.js';
import { PrizeClaimerEnvVars } from './../types.js';

export const loadPrizeClaimerEnvVars = (): PrizeClaimerEnvVars => {
  const envVars = loadEnvVars();

  const rewardRecipient = process.env.REWARD_RECIPIENT;

  return {
    ...envVars,
    REWARD_RECIPIENT: rewardRecipient,
  };
};
