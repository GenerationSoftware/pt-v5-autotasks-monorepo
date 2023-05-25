import { PopulatedTransaction } from '@ethersproject/contracts';
import { getContract } from '@pooltogether/v5-utils-js';

import { ContractsBlob } from './types';

export async function testnetPrizePoolHandleCompletePrize(
  contracts: ContractsBlob,
  params,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, readProvider } = params;

  const prizePool = getContract('PrizePool', chainId, readProvider, contracts);

  if (!prizePool) {
    throw new Error('TestNet PrizePool: Contract Unavailable');
  }

  const nextDrawEndsAt = await prizePool.functions.nextDrawEndsAt();
  const canCompleteDraw = Date.now() / 1000 > nextDrawEndsAt;

  // Debug Contract Request Parameters
  console.log('Next draw ends at:', Number(nextDrawEndsAt.toString()) * 1000);
  console.log('Date.now():', Date.now());
  console.log('Can Complete Draw:', canCompleteDraw);

  console.log(`TestNet PrizePool: Draw is behind by ${Date.now() / 1000 - nextDrawEndsAt} seconds`);

  let transactionPopulated: PopulatedTransaction | undefined;

  if (canCompleteDraw) {
    console.log('TestNet PrizePool: Completing Draw');
    const randNum = Math.floor(Math.random() * 10 ** 10);
    transactionPopulated = await prizePool.populateTransaction.completeAndStartNextDraw(randNum);
  } else {
    console.log(
      `TestNet PrizePool: Draw not ready to start.\nReady in ${
        nextDrawEndsAt - Date.now() / 1000
      } seconds`,
    );
  }

  return transactionPopulated;
}
