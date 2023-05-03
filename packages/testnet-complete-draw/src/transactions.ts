import { Relayer } from "defender-relay-client";
import { DefenderRelayProvider } from "defender-relay-client/lib/ethers";
import {
  testnetContractsBlob as contracts,
  testnetPrizePoolHandleCompletePrize
} from "@pooltogether/v5-autotasks-library";

export async function processTransaction(event, params) {
  const { chainId } = params;

  const relayer = new Relayer(event);
  const provider = new DefenderRelayProvider(event);

  try {
    const transactionPopulated = await testnetPrizePoolHandleCompletePrize(contracts, {
      chainId,
      provider
    });

    if (transactionPopulated) {
      let transactionSentToNetwork = await relayer.sendTransaction({
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 200000
      });
      console.log("TransactionHash:", transactionSentToNetwork.hash);
    } else {
      console.log("TestNet PrizePool: Transaction not populated");
    }
  } catch (error) {
    throw new Error(error);
  }
}
