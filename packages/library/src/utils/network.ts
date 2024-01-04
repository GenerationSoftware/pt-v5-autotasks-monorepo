import { CHAINS_BY_ID, FLASHBOTS_SUPPORTED_CHAINS } from '../constants/network';

export const canUseIsPrivate = (chainId, useFlashbots) => {
  const chainSupportsFlashbots = FLASHBOTS_SUPPORTED_CHAINS.includes(chainId);
  const isPrivate = Boolean(chainSupportsFlashbots && useFlashbots);

  return isPrivate;
};

export const chainName = (chainId: number) => {
  return `${CHAINS_BY_ID[chainId]}`;
};
