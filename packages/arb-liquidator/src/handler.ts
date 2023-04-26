import { Relayer } from "defender-relay-client";
import { ethers } from "ethers";
import { Provider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import {
  liquidatorHandleArbSwap,
  testnetContractsBlob as contracts,
  ArbLiquidatorSwapParams,
  NETWORK_NAMES
} from "@pooltogether/v5-autotasks-library";

const handlerLoadParams = (signer: Provider | DefenderRelaySigner): ArbLiquidatorSwapParams => {
  const chainId = Number(CHAIN_ID);

  const readProvider = new ethers.providers.InfuraProvider(NETWORK_NAMES[chainId], INFURA_API_KEY);

  return {
    writeProvider: signer,
    readProvider,
    chainId,
    swapRecipient: SWAP_RECIPIENT,
    relayerAddress: RELAYER_ADDRESS
  };
};

export async function handler(event) {
  console.clear();

  const relayer = new Relayer(event);
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });

  const params: ArbLiquidatorSwapParams = handlerLoadParams(signer);

  try {
    await liquidatorHandleArbSwap(contracts, relayer, params);
  } catch (error) {
    throw new Error(error);
  }
}
