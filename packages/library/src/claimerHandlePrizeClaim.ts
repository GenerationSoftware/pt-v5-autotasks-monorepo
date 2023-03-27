import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, ProviderOptions } from './types';
import { getContract } from './utils';

const debug = require('debug')('pt-autotask-lib');

export async function claimerHandlePrizeClaim(
  contracts: ContractsBlob,
  config: ProviderOptions,
  feeRecipient: string
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const claimer = getContract('Claimer', chainId, provider, contracts);

  if (!claimer) {
    throw new Error('Claimer: Contract Unavailable');
  }

  // const beaconPeriodEndAt = await claimer.beaconPeriodEndAt();

  // Debug Contract Request Parameters
  // debug('Claimer next Draw.drawId:', nextDrawId);

  let transactionPopulated: PopulatedTransaction | undefined;

  if (prizesToClaim.length > 0) {
    console.log('Claimer: Start Claim Prizes');
    transactionPopulated = await claimer.populateTransaction.claimPrize();
  } else {
    console.log(`Claimer: No Prizes found to claim.`);
  }

  return transactionPopulated;
}
