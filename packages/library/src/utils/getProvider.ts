import { ethers } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

export const getProvider = (envVars): BaseProvider => {
  return new ethers.providers.StaticJsonRpcProvider(envVars.JSON_RPC_URL, Number(envVars.CHAIN_ID));
};
