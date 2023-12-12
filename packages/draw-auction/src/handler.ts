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

  console.log('process.env.RELAY_CHAIN_IDS');
  console.log(process.env.RELAY_CHAIN_IDS);

  const drawAuctionConfig: DrawAuctionConfig = {
    l1ChainId: Number(envVars.CHAIN_ID),
    l1Provider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    useFlashbots: yn(envVars.USE_FLASHBOTS),
    rewardRecipient: envVars.REWARD_RECIPIENT,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),

    customRelayerPrivateKey: process.env.CUSTOM_RELAYER_PRIVATE_KEY,

    relayerApiKey: process.env.RELAYER_API_KEY,
    relayerApiSecret: process.env.RELAYER_API_SECRET,

    relayChainIds: process.env.RELAY_CHAIN_IDS.split(',').map((chainId) => Number(chainId)),
    arbitrumRelayJsonRpcUri: process.env.ARBITRUM_JSON_RPC_URI,
    optimismRelayJsonRpcUri: process.env.OPTIMISM_JSON_RPC_URI,
    arbitrumSepoliaRelayJsonRpcUri: process.env.ARBITRUM_SEPOLIA_JSON_RPC_URI,
    optimismSepoliaRelayJsonRpcUri: process.env.OPTIMISM_SEPOLIA_JSON_RPC_URI,

    signer: relayerAccount.signer,
    rngOzRelayer: relayerAccount.ozRelayer,
    rngWallet: relayerAccount.wallet,
    rngRelayerAddress: relayerAccount.relayerAddress,
  };

  await executeTransactions(drawAuctionConfig);
}
