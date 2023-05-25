import { Relayer } from 'defender-relay-client';
import { ethers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { testnetContractsBlobSepolia as contracts } from '@pooltogether/v5-utils-js';
import {
  liquidatorArbitrageSwap,
  ArbLiquidatorConfigParams,
} from '@pooltogether/v5-autotasks-library';

const handlerLoadParams = (
  signer: Provider | DefenderRelaySigner,
  relayerAddress: string,
): ArbLiquidatorConfigParams => {
  const chainId = Number(BUILD_CHAIN_ID);

  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, chainId);

  return {
    relayerAddress,
    useFlashbots: BUILD_USE_FLASHBOTS,
    writeProvider: signer,
    readProvider,
    chainId,
    swapRecipient: BUILD_SWAP_RECIPIENT,
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
    await liquidatorArbitrageSwap(contracts, relayer, params);
  } catch (error) {
    throw new Error(error);
  }
}
