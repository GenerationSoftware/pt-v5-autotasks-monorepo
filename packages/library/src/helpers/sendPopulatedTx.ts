import { ethers, BigNumber, PopulatedTransaction, Wallet } from 'ethers';

import { SendTransactionArgs, OzSendTransactionArgs, WalletSendTransactionArgs } from '../types.js';
import { printSpacer } from '../utils/index.js';

// const ONE_GWEI = '1000000000';

export const sendPopulatedTx = async (
  wallet: Wallet,
  populatedTx: PopulatedTransaction,
  gasLimit: number,
  gasPrice: BigNumber,
  txParams?: any,
): Promise<ethers.providers.TransactionResponse> => {
  printSpacer();

  // If this is mainnet let's get the current base gas price and add 1 Gwei in
  // hopes it will get picked up quicker
  // const gasPriceStr =
  //   chainId === CHAIN_IDS.mainnet ? gasPrice.add(ONE_GWEI).toString() : gasPrice.toString();

  const sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit,
  };

  const args: WalletSendTransactionArgs = {
    ...sendTransactionArgs,
    gasPrice,
  };

  if (txParams && txParams.value) {
    args.value = txParams.value;
  }
  const tx = await wallet.sendTransaction(args);
  printSpacer();

  return tx;
};
