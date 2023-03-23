import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, ProviderOptions } from './types';
import { getContract } from './utils';

const debug = require('debug')('pt-autotask-lib');

export async function yieldVaultHandleMintRate(
  contracts: ContractsBlob,
  config: ProviderOptions,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const yieldVault = getContract('YieldVault', chainId, provider, contracts);

  if (!yieldVault) {
    throw new Error('YieldVault: Contract Unavailable');
  }

  let transactionPopulated: PopulatedTransaction | undefined;

  console.log('TestNet YieldVault: Completing Draw');

  transactionPopulated = await yieldVault.populateTransaction.mintRate();

  return transactionPopulated;
}
