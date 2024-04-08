import { CHAINS_BY_ID } from '../constants/network.js';

export const chainName = (chainId: number) => {
  return `${CHAINS_BY_ID[chainId]}`;
};
