import { loadEnvVars } from './index.js';
import { PrizeClaimerEnvVars } from './../types.js';

export const loadPrizeClaimerEnvVars = (buildVars?): PrizeClaimerEnvVars => {
  const envVars = loadEnvVars(buildVars);

  const rewardRecipient = buildVars?.rewardRecipient || process.env.REWARD_RECIPIENT;

  return {
    ...envVars,
    REWARD_RECIPIENT: rewardRecipient,
  };
};
