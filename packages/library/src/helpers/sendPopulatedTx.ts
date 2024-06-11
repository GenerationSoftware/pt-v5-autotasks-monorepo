import { ethers, PopulatedTransaction, Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { SendTransactionArgs } from '../types.js';
import { printSpacer } from '../utils/index.js';
import { CHAIN_IDS } from '../constants/network.js';

/**
 * Proxy function for anywhere we send a transaction in this monorepo
 * - Handles proper arg passing when there is a `value` field on the SendTransactionArgs object
 * - Fixes the gas limit for Arbitrum Sepolia
 * - Figures out what the gasPrice should be submitted as
 *
 * @param {number} gasLimit, the original gasLimit, likely from provider.getEstimatedGasLimit()
 * @param {Provider} provider, ethers.js Provider instance
 *
 * @returns {Promise<number>} the new gasLimit
 */
export const sendPopulatedTx = async (
  provider: Provider,
  wallet: Wallet,
  populatedTx: PopulatedTransaction,
  gasLimit: number,
  txParams?: any,
): Promise<ethers.providers.TransactionResponse> => {
  printSpacer();

  let sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit,
  };

  sendTransactionArgs = await fixGasIssues(sendTransactionArgs, gasLimit, provider);

  if (txParams && txParams.value) {
    sendTransactionArgs.value = txParams.value;
  }
  const tx = await wallet.sendTransaction(sendTransactionArgs);

  return tx;
};

/**
 * For any network other than Arbitrum Sepolia simply use `gasPrice`
 *
 * Arbitrum Sepolia has both an 'intrinsic gas too low' issue and an EIP1559 'max fee per gas less
 * than block base fee' bug when using `gasPrice`:
 * - To fix the first issue we can up the `gasLimit`
 * - To fix the second issue we'll use EIP1559 style transactions Arbitrum Sepolia
 *     and multiply it (since it's testnet gas anyhow)
 *
 * @param {SendTransactionArgs} sendTransactionArgs, the args we are going to modify
 * @param {number} gasLimit, the original gasLimit, likely from provider.getEstimatedGasLimit()
 * @param {Provider} provider, ethers.js Provider instance
 *
 * @returns {Promise<number>} the new gasLimit
 */
const fixGasIssues = async (
  sendTransactionArgs: SendTransactionArgs,
  gasLimit: number,
  provider: Provider,
): Promise<SendTransactionArgs> => {
  // @ts-ignore
  if (CHAIN_IDS.arbitrumSepolia === provider._network.chainId) {
    const feeData = await provider.getFeeData();
    const maxFeePerGasMultiplied = feeData.maxFeePerGas.mul(2);

    sendTransactionArgs.maxFeePerGas = maxFeePerGasMultiplied;
    sendTransactionArgs.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.mul(2);
    sendTransactionArgs.gasLimit = gasLimit * 2;
  } else {
    const gasPrice = await provider.getGasPrice();

    sendTransactionArgs.gasPrice = gasPrice;
  }

  return sendTransactionArgs;
};
