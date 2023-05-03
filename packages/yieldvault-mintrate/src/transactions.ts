import { Relayer } from "defender-relay-client";
import { DefenderRelayProvider } from "defender-relay-client/lib/ethers";
import {
  testnetContractsBlob as contracts,
  yieldVaultHandleMintRate
} from "@pooltogether/v5-autotasks-library";

export async function processTransactions(event, params) {
  const { chainId } = params;

  const relayer = new Relayer(event);
  const provider = new DefenderRelayProvider(event);

  const transactionsPopulated = await yieldVaultHandleMintRate(contracts, {
    chainId,
    provider
  });

  if (transactionsPopulated.length > 0) {
    for (const transactionPopulated of transactionsPopulated) {
      try {
        let transactionSentToNetwork = await relayer.sendTransaction({
          data: transactionPopulated.data,
          to: transactionPopulated.to,
          gasLimit: 70000
        });
        console.log("TransactionHash:", transactionSentToNetwork.hash);
      } catch (error) {
        throw new Error(error);
      }
    }
  } else {
    console.log("YieldVault: Transactions not populated");
  }
}
