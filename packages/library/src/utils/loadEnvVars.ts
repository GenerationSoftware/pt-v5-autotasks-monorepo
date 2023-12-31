import yn from 'yn';
import chalk from 'chalk';

import { AutotaskEnvVars } from '../types';
import { chainName } from './network';
import { CHAIN_IDS } from '../constants/network';

// Could potentially collapse this into a dynamic string generator, since it's a lot of repetition
// the only thing that changes is the network name
const JSON_RPC_URI_KEYS = {
  [CHAIN_IDS.mainnet]: 'MAINNET_JSON_RPC_URI',
  [CHAIN_IDS.sepolia]: 'SEPOLIA_JSON_RPC_URI',
  [CHAIN_IDS.optimism]: 'OPTIMISM_JSON_RPC_URI',
  [CHAIN_IDS.arbitrum]: 'ARBITRUM_JSON_RPC_URI',
  [CHAIN_IDS.optimismSepolia]: 'OPTIMISM_SEPOLIA_JSON_RPC_URI',
  [CHAIN_IDS.arbitrumSepolia]: 'ARBITRUM_SEPOLIA_JSON_RPC_URI',
};

const CHAIN_RELAYER_API_KEY_KEYS = {
  [CHAIN_IDS.mainnet]: 'MAINNET_RELAYER_API_KEY',
  [CHAIN_IDS.sepolia]: 'SEPOLIA_RELAYER_API_KEY',
  [CHAIN_IDS.optimism]: 'OPTIMISM_RELAYER_API_KEY',
  [CHAIN_IDS.arbitrum]: 'ARBITRUM_RELAYER_API_KEY',
  [CHAIN_IDS.optimismSepolia]: 'OPTIMISM_SEPOLIA_RELAYER_API_KEY',
  [CHAIN_IDS.arbitrumSepolia]: 'ARBITRUM_SEPOLIA_RELAYER_API_KEY',
};

const CHAIN_RELAYER_API_SECRET_KEYS = {
  [CHAIN_IDS.mainnet]: 'MAINNET_RELAYER_API_SECRET',
  [CHAIN_IDS.sepolia]: 'SEPOLIA_RELAYER_API_SECRET',
  [CHAIN_IDS.optimism]: 'OPTIMISM_RELAYER_API_SECRET',
  [CHAIN_IDS.arbitrum]: 'ARBITRUM_RELAYER_API_SECRET',
  [CHAIN_IDS.optimismSepolia]: 'OPTIMISM_SEPOLIA_RELAYER_API_SECRET',
  [CHAIN_IDS.arbitrumSepolia]: 'ARBITRUM_SEPOLIA_RELAYER_API_SECRET',
};

export const loadEnvVars = (buildVars?, event?): AutotaskEnvVars => {
  const chainId = Number(buildVars?.chainId || process.env.CHAIN_ID);
  const useFlashbots = yn(buildVars?.useFlashbots || process.env.USE_FLASHBOTS);
  const minProfitThresholdUsd =
    buildVars?.minProfitThresholdUsd || process.env.MIN_PROFIT_THRESHOLD_USD;

  console.log(chalk.blue(`Operating on: ${chainName(chainId)}`));

  // Secrets (API keys, etc) not safe for building into a flat file
  let covalentApiKey = process.env.COVALENT_API_KEY;
  let customRelayerPrivateKey = process.env.CUSTOM_RELAYER_PRIVATE_KEY;
  let arbitrumJsonRpcUri = process.env.ARBITRUM_JSON_RPC_URI;
  let optimismJsonRpcUri = process.env.OPTIMISM_JSON_RPC_URI;
  let arbitrumSepoliaJsonRpcUri = process.env.ARBITRUM_SEPOLIA_JSON_RPC_URI;
  let optimismSepoliaJsonRpcUri = process.env.OPTIMISM_SEPOLIA_JSON_RPC_URI;
  let jsonRpcUri = process.env.JSON_RPC_URI;
  let relayerApiKey = process.env.RELAYER_API_KEY;
  let relayerApiSecret = process.env.RELAYER_API_SECRET;

  if (event?.secrets) {
    const jsonRpcUriKey = JSON_RPC_URI_KEYS[chainId];
    jsonRpcUri = event.secrets[jsonRpcUriKey];

    const relayerApiKeyKey = CHAIN_RELAYER_API_KEY_KEYS[chainId];
    relayerApiKey = event.secrets[relayerApiKeyKey];

    const relayerApiSecretKey = CHAIN_RELAYER_API_SECRET_KEYS[chainId];
    relayerApiSecret = event.secrets[relayerApiSecretKey];

    covalentApiKey = event.secrets.COVALENT_API_KEY;
    // TODO: Technically this makes no sense, as we don't want a custom privkey when running on OZ Defender
    // (where there is event.secrets)
    customRelayerPrivateKey = event.secrets.CUSTOM_RELAYER_PRIVATE_KEY;

    const arbitrumJsonRpcUriKey = JSON_RPC_URI_KEYS[CHAIN_IDS.arbitrum];
    arbitrumJsonRpcUri = event.secrets[arbitrumJsonRpcUriKey];

    const optimismJsonRpcUriKey = JSON_RPC_URI_KEYS[CHAIN_IDS.optimism];
    optimismJsonRpcUri = event.secrets[optimismJsonRpcUriKey];

    const arbitrumSepoliaJsonRpcUriKey = JSON_RPC_URI_KEYS[CHAIN_IDS.arbitrumSepolia];
    arbitrumSepoliaJsonRpcUri = event.secrets[arbitrumSepoliaJsonRpcUriKey];

    const optimismSepoliaJsonRpcUriKey = JSON_RPC_URI_KEYS[CHAIN_IDS.optimismSepolia];
    optimismSepoliaJsonRpcUri = event.secrets[optimismSepoliaJsonRpcUriKey];
  }

  return {
    CHAIN_ID: Number(chainId),
    JSON_RPC_URI: jsonRpcUri || process.env.JSON_RPC_URI,
    USE_FLASHBOTS: useFlashbots,
    MIN_PROFIT_THRESHOLD_USD: minProfitThresholdUsd,
    COVALENT_API_KEY: covalentApiKey,
    CUSTOM_RELAYER_PRIVATE_KEY: customRelayerPrivateKey,
    RELAYER_API_KEY: relayerApiKey,
    RELAYER_API_SECRET: relayerApiSecret,
    ARBITRUM_JSON_RPC_URI: arbitrumJsonRpcUri,
    OPTIMISM_JSON_RPC_URI: optimismJsonRpcUri,
    ARBITRUM_SEPOLIA_JSON_RPC_URI: arbitrumSepoliaJsonRpcUri,
    OPTIMISM_SEPOLIA_JSON_RPC_URI: optimismSepoliaJsonRpcUri,
  };
};
