import chalk from 'chalk';

import { loadEnvVars } from './index.js';
import { DrawAuctionEnvVars } from './../types.js';

export const loadDrawAuctionEnvVars = (): DrawAuctionEnvVars => {
  const envVars = loadEnvVars();

  const rewardRecipient = process.env.REWARD_RECIPIENT;
  const errorStateMaxGasCostThresholdUsd = Number(
    process.env.ERROR_STATE_MAX_GAS_COST_THRESHOLD_USD,
  );

  if (!errorStateMaxGasCostThresholdUsd) {
    const message =
      'Error: Unable to find necessary environment variables, please ensure your environment is set up correctly with the ERROR_STATE_MAX_GAS_COST_THRESHOLD_USD variable. Refer to the README for more info.';
    console.log(chalk.red(message));
    throw new Error(message);
  }

  return {
    ...envVars,
    REWARD_RECIPIENT: rewardRecipient,
    ERROR_STATE_MAX_GAS_COST_THRESHOLD_USD: errorStateMaxGasCostThresholdUsd,
  };
};
