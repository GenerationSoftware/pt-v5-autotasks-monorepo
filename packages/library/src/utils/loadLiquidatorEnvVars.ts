import { loadEnvVars } from './index.js';
import { LiquidatorEnvVars } from './../types.js';

export const loadLiquidatorEnvVars = (): LiquidatorEnvVars => {
  const envVars = loadEnvVars();

  const swapRecipient = process.env.SWAP_RECIPIENT;
  const envTokenAllowList = !!process.env.ENV_TOKEN_ALLOW_LIST
    ? process.env.ENV_TOKEN_ALLOW_LIST.toLowerCase().split(',')
    : [];
  const pairsToLiquidate = !!process.env.PAIRS_TO_LIQUIDATE
    ? process.env.PAIRS_TO_LIQUIDATE.toLowerCase().split(',')
    : [];

  if (envTokenAllowList.length > 0) {
    console.log('');
    console.log('ENV_TOKEN_ALLOW_LIST is:');
    console.log(envTokenAllowList);
    console.log('');
  }

  return {
    ...envVars,
    SWAP_RECIPIENT: swapRecipient,
    ENV_TOKEN_ALLOW_LIST: envTokenAllowList,
    PAIRS_TO_LIQUIDATE: pairsToLiquidate,
  };
};
