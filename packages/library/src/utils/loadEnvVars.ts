import yn from 'yn';
import chalk from 'chalk';

import { chainName } from './network.js';
import { AutotaskEnvVars } from '../types.js';

export const loadEnvVars = (buildVars?): AutotaskEnvVars => {
  const chainId = Number(buildVars?.chainId || process.env.CHAIN_ID);

  const useFlashbots = yn(buildVars?.useFlashbots || process.env.USE_FLASHBOTS);
  const minProfitThresholdUsd =
    buildVars?.minProfitThresholdUsd || process.env.MIN_PROFIT_THRESHOLD_USD;

  console.log(chalk.blue(`Operating on: ${chainName(chainId)}`));

  let covalentApiKey = process.env.COVALENT_API_KEY;
  let customRelayerPrivateKey = process.env.CUSTOM_RELAYER_PRIVATE_KEY;
  let jsonRpcUri = process.env.JSON_RPC_URI;

  if (!chainId || !minProfitThresholdUsd || !customRelayerPrivateKey || !jsonRpcUri) {
    const message =
      'Error: Unable to find necessary environment variables, please ensure your environment is set up correctly. Refer to the README for more info.';
    console.log(chalk.red(message));
    throw new Error(message);
  }

  return {
    CHAIN_ID: Number(chainId),
    JSON_RPC_URI: jsonRpcUri || process.env.JSON_RPC_URI,
    USE_FLASHBOTS: useFlashbots,
    MIN_PROFIT_THRESHOLD_USD: minProfitThresholdUsd,
    COVALENT_API_KEY: covalentApiKey,
    CUSTOM_RELAYER_PRIVATE_KEY: customRelayerPrivateKey,
  };
};
