import { ethers } from 'ethers';
import { RelayerParams } from '@openzeppelin/defender-relay-client';
import {
  instantiateRelayerAccount,
  loadEnvVars,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './executeTransactions';

export async function handler(event: RelayerParams) {
  const buildVars = {
    chainId: BUILD_CHAIN_ID,
  };

  const envVars = loadEnvVars(buildVars, event);

  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const provider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    provider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config = {
    ...relayerAccount,
    chainId: envVars.CHAIN_ID,
    provider,
  };

  await executeTransactions(config);
}
