import { Relayer } from "defender-relay-client";
import { DefenderRelayProvider } from "defender-relay-client/lib/ethers";
import {
  testnetContractsBlob as contracts,
  testnetPrizePoolHandleCompletePrize
} from "@pooltogether/v5-autotasks-library";

export async function processTransaction(event, params) {
  const { chainId } = params;

  const relayer = new Relayer(event);
  const writeProvider = new DefenderRelayProvider(event);

  try {
    const populatedTx = await testnetPrizePoolHandleCompletePrize(contracts, {
      chainId,
      writeProvider
    });

    if (populatedTx) {
      let transactionSentToNetwork = await relayer.sendTransaction({
        data: populatedTx.data,
        to: populatedTx.to,
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
