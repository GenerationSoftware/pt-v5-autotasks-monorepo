import { Relayer } from 'defender-relay-client';
import { ethers } from 'ethers';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  instantiateRelayerAccount,
  liquidatorArbitrageSwap,
  ArbLiquidatorConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';
import fetch from 'node-fetch';

export async function handler(event) {
  const chainId = Number(BUILD_CHAIN_ID);
  const covalentApiKey = BUILD_COVALENT_API_KEY;

  // const relayer = new Relayer(event);
  // const provider = new DefenderRelayProvider(event);
  // const signer = new DefenderRelaySigner(event, provider, {
  //   speed: 'fast',
  // });
  // const relayerAddress = await signer.getAddress();

  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, chainId);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    readProvider, // TODO: Fix this!
    readProvider,
    event,
    BUILD_CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const arbLiquidatorConfigParams: ArbLiquidatorConfigParams = {
    ...relayerAccount,
    writeProvider: readProvider, // TODO: Fix this!
    readProvider: readProvider,
    chainId,
    covalentApiKey,
    swapRecipient: BUILD_SWAP_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };

  // TODO: Simply use the populate/processPopulatedTransactions pattern here as well
  try {
    const contracts: ContractsBlob = await downloadContractsBlob(
      arbLiquidatorConfigParams.chainId,
      fetch,
    );
    await liquidatorArbitrageSwap(contracts, arbLiquidatorConfigParams);
  } catch (error) {
    throw new Error(error);
  }
}
