import yn from 'yn';
import { ethers } from 'ethers';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import {
  instantiateRelayerAccount,
  DrawAuctionConfig,
  RelayerAccount,
  DrawAuctionEnvVars,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';
import { loadEnvVars } from './loadEnvVars';

export async function handler(event) {
  const buildVars = {
    chainId: BUILD_CHAIN_ID,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: BUILD_MIN_PROFIT_THRESHOLD_USD,
    rewardRecipient: BUILD_REWARD_RECIPIENT,
    relayChainIds: BUILD_RELAY_CHAIN_IDS,
  };

  const envVars: DrawAuctionEnvVars = loadEnvVars(buildVars, event);
  const rngWriteProvider = new DefenderRelayProvider(event);
  const l1Provider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI,
    Number(envVars.CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    rngWriteProvider,
    l1Provider,
    event,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const drawAuctionConfig: DrawAuctionConfig = {
    l1ChainId: Number(envVars.CHAIN_ID),
    l1Provider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    useFlashbots: yn(envVars.USE_FLASHBOTS),
    rewardRecipient: envVars.REWARD_RECIPIENT,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),

    customRelayerPrivateKey: envVars.CUSTOM_RELAYER_PRIVATE_KEY,

    relayerApiKey: envVars.RELAYER_API_KEY,
    relayerApiSecret: envVars.RELAYER_API_SECRET,

    relayChainIds: envVars.RELAY_CHAIN_IDS,
    arbitrumRelayJsonRpcUri: envVars.ARBITRUM_JSON_RPC_URI,
    optimismRelayJsonRpcUri: envVars.OPTIMISM_JSON_RPC_URI,
    arbitrumSepoliaRelayJsonRpcUri: envVars.ARBITRUM_SEPOLIA_JSON_RPC_URI,
    optimismSepoliaRelayJsonRpcUri: envVars.OPTIMISM_SEPOLIA_JSON_RPC_URI,

    signer: relayerAccount.signer,
    rngOzRelayer: relayerAccount.ozRelayer,
    rngWallet: relayerAccount.wallet,
    rngRelayerAddress: relayerAccount.relayerAddress,
  };

  await executeTransactions(drawAuctionConfig);
}
