import { ethers, PopulatedTransaction, Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { SendTransactionArgs } from '../types.js';
import { printSpacer } from '../utils/index.js';

export const sendPopulatedTx = async (
  provider: Provider,
  wallet: Wallet,
  populatedTx: PopulatedTransaction,
  gasLimit: number,
  txParams?: any,
): Promise<ethers.providers.TransactionResponse> => {
  printSpacer();

  const gasPrice = await provider.getGasPrice();

  const sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit,
    gasPrice,
  };

  if (txParams && txParams.value) {
    sendTransactionArgs.value = txParams.value;
  }
  const tx = await wallet.sendTransaction(sendTransactionArgs);
  printSpacer();

  return tx;
};
