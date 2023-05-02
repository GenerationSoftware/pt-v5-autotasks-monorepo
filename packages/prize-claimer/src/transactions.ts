import { PopulatedTransaction } from "@ethersproject/contracts";
import { RelayerParams } from "defender-relay-client";
import {
  testnetContractsBlob as contracts,
  getClaimerProfitablePrizeTxs,
  PrizeClaimerConfigParams
} from "@pooltogether/v5-autotasks-library";
import { Relayer } from "defender-relay-client";

export const populateTransactions = async (
  params,
  readProvider
): Promise<PopulatedTransaction[]> => {
  let populatedTxs: PopulatedTransaction[] = [];
  try {
    populatedTxs = await getClaimerProfitablePrizeTxs(contracts, readProvider, params);
  } catch (e) {
    console.error(e);
  }

  return populatedTxs;
};

export const processPopulatedTransactions = async (
  event: RelayerParams,
  populatedTxs: PopulatedTransaction[],
  params: PrizeClaimerConfigParams
) => {
  const relayer = new Relayer(event);

  console.log("populatedTxs");
  console.log(populatedTxs);

  try {
    if (populatedTxs.length > 0) {
      for (const populatedTx of populatedTxs) {
        let transactionSentToNetwork = await relayer.sendTransaction({
          isPrivate: params.useFlashbots,
          data: populatedTx.data,
          to: populatedTx.to,
          gasLimit: 3500000
        });
        console.log("TransactionHash:", transactionSentToNetwork.hash);
      }
    } else {
      console.log("Claimer: No transactions populated");
    }
  } catch (error) {
    throw new Error(error);
  }
};
