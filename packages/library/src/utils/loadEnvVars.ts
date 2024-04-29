import chalk from 'chalk';

import { chainName } from './network.js';
import { AutotaskEnvVars } from '../types.js';

export const loadEnvVars = (): AutotaskEnvVars => {
  const chainId = Number(process.env.CHAIN_ID);

  const minProfitThresholdUsd = process.env.MIN_PROFIT_THRESHOLD_USD;

  console.log('');
  console.log(chalk.blue(`Operating on: ${chainName(chainId)}`));

  let covalentApiKey = process.env.COVALENT_API_KEY;
  let customRelayerPrivateKey = process.env.CUSTOM_RELAYER_PRIVATE_KEY;
  let jsonRpcUri = process.env.JSON_RPC_URI;

  if (!chainId || !minProfitThresholdUsd || !customRelayerPrivateKey || !jsonRpcUri) {
    const message =
      'Error: Unable to find necessary environment variables, please ensure your environment is set up correctly with COVALENT_API_KEY, JSON_RPC_URI and CUSTOM_RELAYER_PRIVATE_KEY variables. Refer to the README for more info.';
    console.log(chalk.red(message));
    throw new Error(message);
  }

  return {
    CHAIN_ID: Number(chainId),
    JSON_RPC_URI: jsonRpcUri || process.env.JSON_RPC_URI,
    MIN_PROFIT_THRESHOLD_USD: minProfitThresholdUsd,
    COVALENT_API_KEY: covalentApiKey,
    CUSTOM_RELAYER_PRIVATE_KEY: customRelayerPrivateKey,
  };
};
