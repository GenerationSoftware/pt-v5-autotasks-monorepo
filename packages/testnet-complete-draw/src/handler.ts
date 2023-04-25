import { Relayer, RelayerParams } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import {
  testnetContractsBlob as contracts,
  testnetPrizePoolHandleCompletePrize,
} from "@pooltogether/v5-autotasks-library";

export async function handler(event: RelayerParams) {
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const relayer = new Relayer(event);

  const chainId = Number(process.env.CHAIN_ID);

  try {
    const transactionPopulated = await testnetPrizePoolHandleCompletePrize(contracts, {
      chainId,
      provider: signer,
    });

    if (transactionPopulated) {
      let transactionSentToNetwork = await relayer.sendTransaction({
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 200000,
      });
      console.log("TransactionHash:", transactionSentToNetwork.hash);
    } else {
      console.log("TestNet PrizePool: Transaction not populated");
    }
  } catch (error) {
    throw new Error(error);
  }
}
