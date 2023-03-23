import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, ProviderOptions } from './types';
import { getContract, getContracts } from './utils';

const debug = require('debug')('pt-autotask-lib');

export async function testnetPrizePoolHandleCompletePrize(
  contracts: ContractsBlob,
  config: ProviderOptions,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const prizePool = getContract('PrizePool', chainId, provider, contracts);
  const prizePools = getContracts('PrizePool', chainId, provider, contracts);
  console.log(prizePools);

  if (!prizePool) {
    throw new Error('TestNet PrizePool: Contract Unavailable');
  }

  const nextDrawStartsAt = await prizePool.nextDrawStartsAt();
  const canCompleteDraw = Date.now() / 1000 > nextDrawStartsAt;

  // Debug Contract Request Parameters
  debug('Next draw starts at:', nextDrawStartsAt);
  debug('Date.now():', Date.now());
  debug('Can Complete Draw:', canCompleteDraw);

  let transactionPopulated: PopulatedTransaction | undefined;

  if (canCompleteDraw) {
    console.log('TestNet PrizePool: Completing Draw');

    const randNum = Math.floor(Math.random() * 10 ** 10);
    transactionPopulated = await prizePool.populateTransaction.completeAndStartNextDraw(randNum);
  } else {
    console.log(
      `TestNet PrizePool: Draw not ready to start.\nextDrawStartsAt: ${nextDrawStartsAt}`,
    );
  }

  return transactionPopulated;
}
