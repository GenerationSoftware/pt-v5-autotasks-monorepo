import { Relayer, RelayerParams } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import {
  testnetContractsBlob as contracts,
  claimerHandleClaimPrize,
} from "@pooltogether/v5-autotasks-library";

export async function handler(event: RelayerParams) {
  console.clear();

  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const relayer = new Relayer(event);

  const chainId = Number(process.env.CHAIN_ID);
  const feeRecipient = String(process.env.FEE_RECIPIENT);

  const transactionsPopulated = await claimerHandleClaimPrize(contracts, feeRecipient, {
    chainId,
    provider: signer,
  });

  if (transactionsPopulated.length > 0) {
    for (let i = 0; i < transactionsPopulated.length; i++) {
      const transactionPopulated = transactionsPopulated[i];
      try {
        let transactionSentToNetwork = await relayer.sendTransaction({
          data: transactionPopulated.data,
          to: transactionPopulated.to,
          gasLimit: 200000,
        });
        console.log("TransactionHash:", transactionSentToNetwork.hash);
      } catch (error) {
        throw new Error(error);
      }
    }
  } else {
    console.log("PrizeClaimer: No transactions populated");
  }
}
