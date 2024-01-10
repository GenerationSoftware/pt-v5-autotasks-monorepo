import { FlashLiquidatorEnvVars, loadEnvVars } from '@generationsoftware/pt-v5-autotasks-library';

export const loadFlashLiquidatorEnvVars = (buildVars?, event?): FlashLiquidatorEnvVars => {
  const envVars = loadEnvVars(buildVars, event);

  const swapRecipient = buildVars?.swapRecipient || process.env.SWAP_RECIPIENT;

  return {
    ...envVars,
    SWAP_RECIPIENT: swapRecipient,
  };
};
