import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';

export async function testnetPrizePoolHandleCompletePrize(
  contracts: ContractsBlob,
  params,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, readProvider } = params;

  const prizePool = getContract('PrizePool', chainId, readProvider, contracts);

  if (!prizePool) {
    throw new Error('TestNet PrizePool: Contract Unavailable');
  }
  console.log(prizePool.address);

  const openDrawEndsAt = await prizePool.functions.openDrawEndsAt();
  const canCompleteDraw = Date.now() / 1000 > openDrawEndsAt;

  // Debug Contract Request Parameters
  console.log('Next draw ends at:', Number(openDrawEndsAt.toString()) * 1000);
  console.log('Date.now():', Date.now());
  console.log('Can Complete Draw:', canCompleteDraw);

  const diff = Date.now() / 1000 - openDrawEndsAt;
  const laggingBehind = diff > 0;
  if (laggingBehind) {
    console.log(`TestNet PrizePool: Draw is behind by ${diff} seconds`);
  }

  let transactionPopulated: PopulatedTransaction | undefined;

  if (canCompleteDraw) {
    console.log('TestNet PrizePool: Completing Draw');
    const randNum = Math.floor(Math.random() * 10 ** 10);
    transactionPopulated = await prizePool.populateTransaction.closeDraw(randNum);
  } else {
    console.log(
      `TestNet PrizePool: Draw not ready to start.\nReady in ${
        openDrawEndsAt - Date.now() / 1000
      } seconds`,
    );
  }

  return transactionPopulated;
}
