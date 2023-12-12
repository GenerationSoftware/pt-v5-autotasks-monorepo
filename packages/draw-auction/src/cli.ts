import esMain from 'es-main';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  DrawAuctionConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';

import { executeTransactions } from './transactions';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Draw Auction Bot')));

const loadEnvVars = () => {
  return {
    CHAIN_ID: Number(process.env.CHAIN_ID),
    JSON_RPC_URI: process.env.JSON_RPC_URI,
    COVALENT_API_KEY: process.env.COVALENT_API_KEY,
    USE_FLASHBOTS: process.env.USE_FLASHBOTS,
    MIN_PROFIT_THRESHOLD_USD: process.env.MIN_PROFIT_THRESHOLD_USD,
    CUSTOM_RELAYER_PRIVATE_KEY: process.env.CUSTOM_RELAYER_PRIVATE_KEY,
    DEFENDER_TEAM_API_KEY: process.env.DEFENDER_TEAM_API_KEY,
    DEFENDER_TEAM_API_SECRET: process.env.DEFENDER_TEAM_API_SECRET,
    RELAYER_API_KEY: process.env.RELAYER_API_KEY,
    RELAYER_API_SECRET: process.env.RELAYER_API_SECRET,
    REWARD_RECIPIENT: process.env.REWARD_RECIPIENT,
    RELAY_CHAIN_IDS: process.env.RELAY_CHAIN_IDS,
    ARBITRUM_RELAY_JSON_RPC_URI: process.env.ARBITRUM_RELAY_JSON_RPC_URI,
    OPTIMISM_RELAY_JSON_RPC_URI: process.env.OPTIMISM_RELAY_JSON_RPC_URI,
    ARBITRUM_SEPOLIA_RELAY_JSON_RPC_URI: process.env.ARBITRUM_SEPOLIA_RELAY_JSON_RPC_URI,
    OPTIMISM_SEPOLIA_RELAY_JSON_RPC_URI: process.env.OPTIMISM_SEPOLIA_RELAY_JSON_RPC_URI,
  };
};

if (esMain(import.meta)) {
  const envVars = loadEnvVars();

  const rngReadProvider = new ethers.providers.JsonRpcProvider(
    envVars.JSON_RPC_URI, // is RNG chain RPC URI
    envVars.CHAIN_ID, // is RNG chain ID
  );

  const mockEvent = {
    apiKey: envVars.RELAYER_API_KEY, // RNG chain OZ relayer API Key
    apiSecret: envVars.RELAYER_API_SECRET, // RNG chain OZ relayer API secret
  };
  const rngWriteProvider = new DefenderRelayProvider(mockEvent);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    rngWriteProvider,
    rngReadProvider,
    mockEvent,
    envVars.CUSTOM_RELAYER_PRIVATE_KEY,
  );

  console.log('Boolean(envVars.USE_FLASHBOTS)');
  console.log(Boolean(envVars.USE_FLASHBOTS));

  const drawAuctionConfigParams: DrawAuctionConfigParams = {
    chainId: envVars.CHAIN_ID,
    readProvider: rngReadProvider,
    covalentApiKey: envVars.COVALENT_API_KEY,
    useFlashbots: Boolean(envVars.USE_FLASHBOTS),
    rewardRecipient: envVars.REWARD_RECIPIENT,
    minProfitThresholdUsd: Number(envVars.MIN_PROFIT_THRESHOLD_USD),

    customRelayerPrivateKey: process.env.CUSTOM_RELAYER_PRIVATE_KEY,

    relayerApiKey: process.env.RELAYER_API_KEY,
    relayerApiSecret: process.env.RELAYER_API_SECRET,

    relayChainIds: process.env.RELAY_CHAIN_IDS.split(',').map((chainId) => Number(chainId)),
    arbitrumRelayJsonRpcUri: process.env.ARBITRUM_RELAY_JSON_RPC_URI,
    optimismRelayJsonRpcUri: process.env.OPTIMISM_RELAY_JSON_RPC_URI,
    arbitrumSepoliaRelayJsonRpcUri: process.env.ARBITRUM_SEPOLIA_RELAY_JSON_RPC_URI,
    optimismSepoliaRelayJsonRpcUri: process.env.OPTIMISM_SEPOLIA_RELAY_JSON_RPC_URI,

    signer: relayerAccount.signer,
    rngWallet: relayerAccount.wallet,
    rngOzRelayer: relayerAccount.ozRelayer,
    rngRelayerAddress: relayerAccount.relayerAddress,
  };

  await executeTransactions(drawAuctionConfigParams);
}

export function main() {}
