import chalk from 'chalk';

import { chainName } from './network.js';
import { AutotaskEnvVars } from '../types.js';

export const loadEnvVars = (): AutotaskEnvVars => {
  const chainId = Number(process.env.CHAIN_ID);

  const minProfitThresholdUsd = process.env.MIN_PROFIT_THRESHOLD_USD;

  console.log('');
  console.log(chalk.blue(`Operating on: ${chainName(chainId)}`));
  console.log('');

  const covalentApiKey = process.env.COVALENT_API_KEY;
  const coingeckoApiKey = process.env.COINGECKO_API_KEY;
  const customRelayerPrivateKey = process.env.CUSTOM_RELAYER_PRIVATE_KEY;
  const jsonRpcUrl = process.env.JSON_RPC_URL;
  const contractJsonUrl = process.env.CONTRACT_JSON_URL;

  if (
    !chainId ||
    !minProfitThresholdUsd ||
    !customRelayerPrivateKey ||
    !jsonRpcUrl ||
    !contractJsonUrl
  ) {
    const message =
      'Error: Unable to find necessary environment variables, please ensure your environment is set up correctly with JSON_RPC_URL, CUSTOM_RELAYER_PRIVATE_KEY, and CONTRACT_JSON_URL variables. Refer to the README for more info.';
    console.log(chalk.red(message));
    throw new Error(message);
  }

  return {
    CHAIN_ID: Number(chainId),
    JSON_RPC_URL: jsonRpcUrl || process.env.JSON_RPC_URL,
    MIN_PROFIT_THRESHOLD_USD: minProfitThresholdUsd,
    COVALENT_API_KEY: covalentApiKey,
    COINGECKO_API_KEY: coingeckoApiKey,
    CUSTOM_RELAYER_PRIVATE_KEY: customRelayerPrivateKey,
    CONTRACT_JSON_URL: contractJsonUrl,
  };
};
