import { Relayer, RelayerParams } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import { testnetContractsBlobSepolia as contracts } from "@pooltogether/v5-utils-js";
import { drawBeaconHandleDrawStartAndComplete } from "@pooltogether/v5-autotasks-library";

export async function handler(event: RelayerParams) {
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const relayer = new Relayer(event);

  const chainId = Number(process.env.CHAIN_ID);

  try {
    const transactionPopulated = await drawBeaconHandleDrawStartAndComplete(contracts, {
      chainId,
      provider: signer,
    });

    if (transactionPopulated) {
      let transactionSentToNetwork = await relayer.sendTransaction({
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 500000,
      });
      console.log("TransactionHash:", transactionSentToNetwork.hash);
    } else {
      console.log("DrawBeacon: Transaction not populated");
    }
  } catch (error) {
    throw new Error(error);
  }
}
