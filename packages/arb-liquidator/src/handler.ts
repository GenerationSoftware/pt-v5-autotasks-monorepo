import { Relayer } from "defender-relay-client";
import { ethers } from "ethers";
import { Provider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import {
  liquidatorArbitrageSwap,
  testnetContractsBlob as contracts,
  ArbLiquidatorConfigParams
} from "@pooltogether/v5-autotasks-library";

const handlerLoadParams = (
  signer: Provider | DefenderRelaySigner,
  relayerAddress: string
): ArbLiquidatorConfigParams => {
  const chainId = Number(CHAIN_ID);

  const readProvider = new ethers.providers.InfuraProvider(chainId, INFURA_API_KEY);

  return {
    relayerAddress,
    useFlashbots: USE_FLASHBOTS,
    writeProvider: signer,
    readProvider,
    chainId,
    swapRecipient: SWAP_RECIPIENT
  };
};

export async function handler(event) {
  console.clear();

  const relayer = new Relayer(event);
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, {
    speed: "fast"
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
