import { ethers, BigNumber, PopulatedTransaction, Wallet } from 'ethers';
import { Relayer, RelayerTransaction } from 'defender-relay-client';
import chalk from 'chalk';

import { SendTransactionArgs, OzSendTransactionArgs, WalletSendTransactionArgs } from '../types';
import { printSpacer } from '../utils';

const ONE_GWEI = '1000000000';

export const sendPopulatedTx = async (
  rngOzRelayer: Relayer,
  rngWallet: Wallet,
  populatedTx: PopulatedTransaction,
  gasLimit: number,
  gasPrice: BigNumber,
  useFlashbots?: boolean,
  txParams?: any,
): Promise<RelayerTransaction | ethers.providers.TransactionResponse> => {
  const isPrivate = false;
  // const isPrivate = useFlashbots ? canUseIsPrivate(chainId, useFlashbots) : false;
  console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
  printSpacer();

  const gasPriceStr = gasPrice.add(ONE_GWEI).toString();

  const sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit,
  };

  let tx;
  if (rngOzRelayer) {
    const args: OzSendTransactionArgs = {
      ...sendTransactionArgs,
      isPrivate,
      gasPrice: gasPriceStr,
    };

    if (txParams && txParams.value) {
      args.value = txParams.value.toString();
    }

    // @ts-ignore
    tx = await rngOzRelayer.sendTransaction(args);
  } else if (rngWallet) {
    const args: WalletSendTransactionArgs = {
      ...sendTransactionArgs,
      gasPrice: BigNumber.from(gasPriceStr),
    };

    if (txParams && txParams.value) {
      args.value = txParams.value;
    }
    tx = await rngWallet.sendTransaction(args);
  }

  return tx;
};
