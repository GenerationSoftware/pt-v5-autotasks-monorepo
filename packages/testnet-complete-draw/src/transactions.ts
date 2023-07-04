import { Relayer } from 'defender-relay-client';
import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { testnetPrizePoolHandleCompletePrize } from '@generationsoftware/pt-v5-autotasks-library';

export async function processTransaction(event, params) {
  const relayer = new Relayer(event);

  try {
    const contracts = await downloadContractsBlob(params.chainId);
    const populatedTx = await testnetPrizePoolHandleCompletePrize(contracts, params);

    if (populatedTx) {
      let transactionSentToNetwork = await relayer.sendTransaction({
        data: populatedTx.data,
        to: populatedTx.to,
        gasLimit: 200000,
      });
      console.log('TransactionHash:', transactionSentToNetwork.hash);
    } else {
      console.log('TestNet PrizePool: Transaction not populated');
    }
  } catch (error) {
    throw new Error(error);
  }
}
