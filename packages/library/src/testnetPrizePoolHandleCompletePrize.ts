import { PopulatedTransaction } from "@ethersproject/contracts";
import { ContractsBlob, ProviderOptions } from "./types";
import { getContract, getContracts } from "./utils";

export async function testnetPrizePoolHandleCompletePrize(
  contracts: ContractsBlob,
  config: ProviderOptions
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const prizePool = getContract("PrizePool", chainId, provider, contracts);

  if (!prizePool) {
    throw new Error("TestNet PrizePool: Contract Unavailable");
  }

  const nextDrawEndsAt = await prizePool.nextDrawEndsAt();
  const canCompleteDraw = Date.now() / 1000 > nextDrawEndsAt;

  // Debug Contract Request Parameters
  console.log("Next draw ends at:", nextDrawEndsAt);
  console.log("Date.now():", Date.now());
  console.log("Can Complete Draw:", canCompleteDraw);

  let transactionPopulated: PopulatedTransaction | undefined;

  if (canCompleteDraw) {
    console.log("TestNet PrizePool: Completing Draw");

    const randNum = Math.floor(Math.random() * 10 ** 10);
    transactionPopulated = await prizePool.populateTransaction.completeAndStartNextDraw(randNum);
  } else {
    console.log(
      `TestNet PrizePool: Draw not ready to start.\nReady in ${
        nextDrawEndsAt - Date.now() / 1000
      } seconds`
    );
  }

  return transactionPopulated;
}
