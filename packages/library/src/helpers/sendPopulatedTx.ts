import { ethers, PopulatedTransaction, Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { SendTransactionArgs, WalletSendTransactionArgs } from '../types.js';
import { printSpacer } from '../utils/index.js';

export const sendPopulatedTx = async (
  provider: Provider,
  wallet: Wallet,
  populatedTx: PopulatedTransaction,
  gasLimit: number,
  txParams?: any,
): Promise<ethers.providers.TransactionResponse> => {
  printSpacer();

  const feeData = await provider.getFeeData();

  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  const maxFeePerGas = feeData.maxFeePerGas;

  // const gasPrice = await provider.getGasPrice();

  const sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit,
  };

  const args: WalletSendTransactionArgs = {
    ...sendTransactionArgs,
    // gasPrice,
    maxPriorityFeePerGas,
    maxFeePerGas,
  };

  if (txParams && txParams.value) {
    args.value = txParams.value;
  }
  const tx = await wallet.sendTransaction(args);
  printSpacer();

  return tx;
};
