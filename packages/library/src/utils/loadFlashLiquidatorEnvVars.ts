import { loadEnvVars } from './index.js';
import { FlashLiquidatorEnvVars } from './../types.js';

export const loadFlashLiquidatorEnvVars = (buildVars?): FlashLiquidatorEnvVars => {
  const envVars = loadEnvVars(buildVars);

  const swapRecipient = buildVars?.swapRecipient || process.env.SWAP_RECIPIENT;

  return {
    ...envVars,
    SWAP_RECIPIENT: swapRecipient,
  };
};
