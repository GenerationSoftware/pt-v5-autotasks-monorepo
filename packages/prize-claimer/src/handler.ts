import { ethers } from "ethers";
import { Relayer, RelayerParams } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import {
  testnetContractsBlob as contracts,
  claimerHandleClaimPrize,
} from "@pooltogether/v5-autotasks-library";

// Docs
export async function handler(event: RelayerParams) {
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const relayer = new Relayer(event);

  const chainId = Number(process.env.CHAIN_ID);
  const feeRecipient = `0x${process.env.FEE_RECIPIENT}`;

  // TODO: Don't hardcode goerli
  const readProvider = new ethers.providers.InfuraProvider("goerli", process.env.INFURA_API_KEY);

  try {
    const transactionsPopulated = await claimerHandleClaimPrize(contracts, feeRecipient, {
      readProvider,
      chainId,
      provider: signer,
    });

    if (transactionsPopulated.length > 0) {
      for (const transactionPopulated of transactionsPopulated) {
        let transactionSentToNetwork = await relayer.sendTransaction({
          data: transactionPopulated.data,
          to: transactionPopulated.to,
          gasLimit: 3500000,
        });
        console.log("TransactionHash:", transactionSentToNetwork.hash);
      }
    } else {
      console.log("Claimer: No transactions populated");
    }
  } catch (error) {
    throw new Error(error);
  }
}
