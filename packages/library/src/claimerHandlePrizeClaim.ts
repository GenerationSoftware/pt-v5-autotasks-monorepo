import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, ProviderOptions } from './types';
import { getContract, getContracts } from './utils';

const debug = require('debug')('pt-autotask-lib');

export async function claimerHandlePrizeClaim(
  contracts: ContractsBlob,
  config: ProviderOptions,
  feeRecipient: string,
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, provider } = config;

  const claimer = getContract('Claimer', chainId, provider, contracts);
  const vaults = getContracts('Vault', chainId, provider, contracts);
  console.log(vaults);

  if (!claimer) {
    throw new Error('Claimer: Contract Unavailable');
  }

  if (vaults.length === 0) {
    throw new Error('Claimer: No Vault contracts found');
  }

  let transactionsPopulated: PopulatedTransaction[] | undefined = [];
  for (let i = 0; i < vaults.length; i++) {
    const vault = vaults[i];

    // const beaconPeriodEndAt = await claimer.beaconPeriodEndAt();

    // Debug Contract Request Parameters
    // debug('Claimer next Draw.drawId:', nextDrawId);

    if (!vault) {
      throw new Error('Vault: Contract Unavailable');
    }

    const prizesToClaim = 0;

    if (prizesToClaim > 0) {
      console.log('Claimer: Start Claim Prizes');
      transactionsPopulated.push(await claimer.populateTransaction.claimPrize(
        vault.address,
        winners,
        tiers,
        minFees,
        feeRecipient
      ));
    } else {
      console.log(`Claimer: No Prizes found to claim for Vault: ${vault.address}.`);
    }
  }

  return transactionsPopulated;
}
