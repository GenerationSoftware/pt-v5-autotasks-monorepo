import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, getContracts } from '@generationsoftware/pt-v5-utils-js';
import { YieldVaultMintRateConfigParams } from './types';

export async function runYieldVaultHandleMintRate(
  contracts: ContractsBlob,
  params: YieldVaultMintRateConfigParams,
): Promise<void> {
  const { chainId, relayer } = params;

  const yieldVaultContracts: Contract[] = getContracts('YieldVault', chainId, relayer, contracts);

  for (const yieldVaultContract of yieldVaultContracts) {
    if (!yieldVaultContract) {
      throw new Error('YieldVault: Contract Unavailable');
    }

    console.log(`YieldVault: mintRate() ${yieldVaultContract.address}`);

    const transactionPopulated: PopulatedTransaction = await yieldVaultContract.populateTransaction.mintRate();

    try {
      let transactionSentToNetwork = await relayer.sendTransaction({
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 70000,
      });
      console.log('TransactionHash:', transactionSentToNetwork.hash);
    } catch (error) {
      throw new Error(error);
    }
  }
}
