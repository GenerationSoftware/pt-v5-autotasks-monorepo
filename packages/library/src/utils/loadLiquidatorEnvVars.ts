import { loadEnvVars } from './index.js';
import { LiquidatorEnvVars } from './../types.js';

export const loadLiquidatorEnvVars = (buildVars?): LiquidatorEnvVars => {
  const envVars = loadEnvVars(buildVars);

  const swapRecipient = buildVars?.swapRecipient || process.env.SWAP_RECIPIENT;

  return {
    ...envVars,
    SWAP_RECIPIENT: swapRecipient,
  };
};
