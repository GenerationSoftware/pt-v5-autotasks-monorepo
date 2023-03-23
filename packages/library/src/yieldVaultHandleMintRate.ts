import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, ProviderOptions } from './types';
import { getContracts } from './utils';

const debug = require('debug')('pt-autotask-lib');

export async function yieldVaultHandleMintRate(
  contracts: ContractsBlob,
  config: ProviderOptions,
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, provider } = config;

  const yieldVaults = getContracts('YieldVault', chainId, provider, contracts);

  let transactionsPopulated: PopulatedTransaction[] | undefined = [];
  for (let i = 0; i < yieldVaults.length; i++) {
    const yieldVault = yieldVaults[i];

    if (!yieldVault) {
      throw new Error('YieldVault: Contract Unavailable');
    }

    console.log('YieldVault: mintRate()');

    transactionsPopulated.push(await yieldVault.populateTransaction.mintRate());
  }

  return transactionsPopulated;
}
