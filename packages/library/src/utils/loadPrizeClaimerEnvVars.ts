import chalk from 'chalk';

import { loadEnvVars } from './index.js';
import { PrizeClaimerEnvVars } from './../types.js';

export const loadPrizeClaimerEnvVars = (): PrizeClaimerEnvVars => {
  const envVars = loadEnvVars();

  const rewardRecipient = process.env.REWARD_RECIPIENT;
  const subgraphUrl = process.env.SUBGRAPH_URL;

  if (!subgraphUrl) {
    const message =
      'Error: Unable to find necessary environment variables, please ensure your environment is set up correctly with the SUBGRAPH_URL variable. Refer to the README for more info.';
    console.log(chalk.red(message));
    throw new Error(message);
  }

  return {
    ...envVars,
    SUBGRAPH_URL: subgraphUrl,
    REWARD_RECIPIENT: rewardRecipient,
  };
};
