import { PrizeClaimerEnvVars, loadEnvVars } from '@generationsoftware/pt-v5-autotasks-library';

export const loadPrizeClaimerEnvVars = (buildVars?, event?): PrizeClaimerEnvVars => {
  const envVars = loadEnvVars(buildVars, event);

  const feeRecipient = buildVars?.feeRecipient || process.env.FEE_RECIPIENT;

  return {
    ...envVars,
    FEE_RECIPIENT: feeRecipient,
  };
};
