import { ethers, BigNumber, PopulatedTransaction, Wallet, Signer } from 'ethers';
import { CHAIN_IDS } from '../constants/network';
import { Relayer, RelayerTransaction } from 'defender-relay-client';
import chalk from 'chalk';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

import { SendTransactionArgs, OzSendTransactionArgs, WalletSendTransactionArgs } from '../types';
import { printSpacer } from '../utils';

const ONE_GWEI = '1000000000';

export const sendPopulatedTx = async (
  chainId: number,
  relayer: Relayer,
  wallet: Wallet,
  populatedTx: PopulatedTransaction,
  gasLimit: number,
  gasPrice: BigNumber,
  useFlashbots?: boolean,
  txParams?: any,
): Promise<RelayerTransaction | ethers.providers.TransactionResponse> => {
  printSpacer();
  const isPrivate = false;
  // const isPrivate = useFlashbots ? canUseIsPrivate(chainId, useFlashbots) : false;
  console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));

  // If this is mainnet let's get the current base gas price and add 1 Gwei in
  // hopes it will get picked up quicker
  const gasPriceStr =
    chainId === CHAIN_IDS.mainnet ? gasPrice.add(ONE_GWEI).toString() : gasPrice.toString();
  // console.log('gasPrice');
  // console.log(gasPrice);

  const sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit,
  };

  let tx;
  if (relayer) {
    const args: OzSendTransactionArgs = {
      ...sendTransactionArgs,
      isPrivate,
      gasPrice: gasPriceStr,
      // gasPrice: `0x${gasPrice.toString()}`,
    };

    if (txParams && txParams.value) {
      args.value = txParams.value.toString();
    }

    // @ts-ignore
    tx = await relayer.sendTransaction(args);
  } else if (wallet) {
    const args: WalletSendTransactionArgs = {
      ...sendTransactionArgs,
      gasPrice,
    };

    if (txParams && txParams.value) {
      args.value = txParams.value;
    }
    tx = await wallet.sendTransaction(args);
  }
  printSpacer();

  return tx;
};
