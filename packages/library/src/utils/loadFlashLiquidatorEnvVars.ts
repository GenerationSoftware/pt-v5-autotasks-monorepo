import { loadEnvVars } from './index.js';
import { FlashLiquidatorEnvVars } from './../types.js';

export const loadFlashLiquidatorEnvVars = (): FlashLiquidatorEnvVars => {
  const envVars = loadEnvVars();

  const swapRecipient = process.env.SWAP_RECIPIENT;

  return {
    ...envVars,
    SWAP_RECIPIENT: swapRecipient,
  };
};
