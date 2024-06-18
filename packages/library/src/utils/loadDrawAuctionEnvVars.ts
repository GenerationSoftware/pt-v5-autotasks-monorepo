import { loadEnvVars } from './index.js';
import { DrawAuctionEnvVars } from './../types.js';

export const loadDrawAuctionEnvVars = (): DrawAuctionEnvVars => {
  const envVars = loadEnvVars();

  const rewardRecipient = process.env.REWARD_RECIPIENT;
  const errorStateMaxGasCostThresholdUsd = Number(
    process.env.ERROR_STATE_MAX_GAS_COST_THRESHOLD_USD,
  );

  return {
    ...envVars,
    REWARD_RECIPIENT: rewardRecipient,
    ERROR_STATE_MAX_GAS_COST_THRESHOLD_USD: errorStateMaxGasCostThresholdUsd,
  };
};
