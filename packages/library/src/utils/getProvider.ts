import { ethers } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

export const getProvider = (envVars): BaseProvider => {
  return new ethers.providers.JsonRpcProvider(envVars.JSON_RPC_URI, Number(envVars.CHAIN_ID));
};
