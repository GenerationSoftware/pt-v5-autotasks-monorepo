import { ethers } from 'ethers';
import { RelayerParams } from 'defender-relay-client';
import { DefenderRelayProvider } from 'defender-relay-client/lib/ethers';
import {
  instantiateRelayerAccount,
  DrawAuctionConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';

export async function handler(event: RelayerParams) {
  const rngWriteProvider = new DefenderRelayProvider(event);
  const rngReadProvider = new ethers.providers.JsonRpcProvider(
    BUILD_JSON_RPC_URI,
    Number(BUILD_CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    rngWriteProvider,
    rngReadProvider,
    event,
    BUILD_CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const drawAuctionConfigParams: DrawAuctionConfigParams = {
    rngChainId: Number(BUILD_CHAIN_ID),
    rngOzRelayer: relayerAccount.ozRelayer,
    rngWallet: relayerAccount.wallet,
    rngRelayerAddress: relayerAccount.relayerAddress,
    rngReadProvider,
    signer: relayerAccount.signer,
    covalentApiKey: BUILD_COVALENT_API_KEY,
    rewardRecipient: BUILD_REWARD_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };
  console.log('drawAuctionConfigParams');
  console.log(drawAuctionConfigParams);

  await executeTransactions(drawAuctionConfigParams, BUILD_RELAYS);
}
