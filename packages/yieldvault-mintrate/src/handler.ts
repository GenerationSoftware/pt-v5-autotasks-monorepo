import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import {
  instantiateRelayerAccount,
  loadEnvVars,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';

export async function handler(event: RelayerParams) {
  const buildVars = {
    chainId: BUILD_CHAIN_ID,
  };

  const envVars = loadEnvVars(buildVars, event);

  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const l1Provider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    l1Provider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config = {
    ...relayerAccount,
    chainId: envVars.CHAIN_ID,
    l1Provider,
  };

  await executeTransactions(config);
}
