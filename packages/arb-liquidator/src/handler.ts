import { Relayer } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import {
  liquidatorHandleArbSwap,
  testnetContractsBlob as contracts,
} from "@pooltogether/v5-autotasks-library";

export async function handler(event) {
  console.clear();

  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const relayer = new Relayer(event);

  const chainId = Number(process.env.CHAIN_ID);

  const relayerAddress = `0x${process.env.RELAYER_ADDRESS}`;
  const swapRecipient = `0x${process.env.SWAP_RECIPIENT}`;

  try {
    await liquidatorHandleArbSwap(contracts, relayer, relayerAddress, swapRecipient, {
      chainId,
      provider: signer,
    });
  } catch (error) {
    throw new Error(error);
  }
}
