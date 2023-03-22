import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, ProviderOptions } from './types';
import { getContract } from './utils';

const debug = require('debug')('pt-autotask-lib');

export async function testnetPrizePoolHandleCompletePrize(
  contracts: ContractsBlob,
  config: ProviderOptions,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const prizePool = getContract('TestNet PrizePool', chainId, provider, contracts);

  if (!prizePool) {
    throw new Error('TestNet PrizePool: Contract Unavailable');
  }

  const nextDrawStartsAt = await prizePool.nextDrawStartsAt();
  const canCompleteDraw = (Date.now() / 1000) > nextDrawStartsAt;

  // Debug Contract Request Parameters
  debug('Next draw starts at:', nextDrawStartsAt);
  debug('Date.now():', Date.now());
  debug('Can Complete Draw:', canCompleteDraw);

  let transactionPopulated: PopulatedTransaction | undefined;

  if (canCompleteDraw) {
    const randNum = Math.floor(Math.random()*10**10)
    console.log('TestNet PrizePool: Starting Draw');
    transactionPopulated = await prizePool.populateTransaction.completeAndStartNextDraw(randNum);
  } else {
    console.log(
      `TestNet PrizePool: Draw not ready to start.\nextDrawStartsAt: ${nextDrawStartsAt}`,
    );
  }

  return transactionPopulated;
}
