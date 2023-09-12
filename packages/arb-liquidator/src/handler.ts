import { Relayer } from 'defender-relay-client';
import { ethers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  liquidatorArbitrageSwap,
  ArbLiquidatorConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import fetch from 'node-fetch';

const handlerLoadParams = (
  signer: Provider | DefenderRelaySigner,
  relayerAddress: string,
): ArbLiquidatorConfigParams => {
  const chainId = Number(BUILD_CHAIN_ID);
  const covalentApiKey = BUILD_COVALENT_API_KEY;

  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, chainId);

  return {
    relayerAddress,
    writeProvider: signer,
    readProvider,
    chainId,
    covalentApiKey,
    swapRecipient: BUILD_SWAP_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };
};

export async function handler(event) {
  const relayer = new Relayer(event);
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, {
    speed: 'fast',
  });
  const relayerAddress = await signer.getAddress();

  const params: ArbLiquidatorConfigParams = handlerLoadParams(signer, relayerAddress);

  // TODO: Simply use the populate/processPopulatedTransactions pattern here as well
  try {
    const contracts: ContractsBlob = await downloadContractsBlob(params.chainId, fetch);
    await liquidatorArbitrageSwap(contracts, relayer, params);
  } catch (error) {
    throw new Error(error);
  }
}
