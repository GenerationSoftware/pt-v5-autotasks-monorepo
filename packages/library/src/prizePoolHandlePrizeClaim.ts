import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, ProviderOptions } from './types';
import { getContract } from './utils';

const debug = require('debug')('pt-autotask-lib');

export async function prizePoolHandlePrizeClaim(
  contracts: ContractsBlob,
  config: ProviderOptions,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const prizePool = getContract('PrizePool', chainId, provider, contracts);

  if (!prizePool) {
    throw new Error('PrizePool: Contract Unavailable');
  }

  // const beaconPeriodEndAt = await prizePool.beaconPeriodEndAt();

  // Debug Contract Request Parameters
  // debug('PrizePool next Draw.drawId:', nextDrawId);

  let transactionPopulated: PopulatedTransaction | undefined;

  if (prizesToClaim.length > 0) {
    console.log('PrizePool: Start Claim Prizes');
    transactionPopulated = await prizePool.populateTransaction.claimPrize();
  } else {
    console.log(
      `PrizePool: No Prizes found to claim.`,
    );
  }

  return transactionPopulated;
}
