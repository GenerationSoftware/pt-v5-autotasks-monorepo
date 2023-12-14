import { ethers } from 'ethers';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  instantiateRelayerAccount,
  runLiquidator,
  LiquidatorConfig,
  LiquidatorEnvVars,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';
import fetch from 'node-fetch';

import { loadLiquidatorEnvVars } from './loadLiquidatorEnvVars';

export async function handler(event) {
  const buildVars = {
    chainId: BUILD_CHAIN_ID,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: BUILD_MIN_PROFIT_THRESHOLD_USD,
    swapRecipient: BUILD_SWAP_RECIPIENT,
  };

  const envVars: LiquidatorEnvVars = loadLiquidatorEnvVars(buildVars, event);

  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY,
    apiSecret: envVars.RELAYER_API_SECRET,
  };

  const readProvider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    readProvider, // TODO: Fix this!
    readProvider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const config: LiquidatorConfig = {
    ...relayerAccount,
    writeProvider: readProvider, // TODO: Fix this!
    readProvider: readProvider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    chainId: envVars.CHAIN_ID,
    swapRecipient: envVars.SWAP_RECIPIENT,
    useFlashbots: envVars.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),
  };

  // TODO: Simply use the populate/processPopulatedTransactions pattern here as well
  try {
    const contracts: ContractsBlob = await downloadContractsBlob(config.chainId, fetch);
    await runLiquidator(contracts, config);
  } catch (error) {
    throw new Error(error);
  }
}
