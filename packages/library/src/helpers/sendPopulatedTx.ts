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

  gasLimit = await getFixedGasLimit(gasLimit, provider);
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

  return tx;
};

/**
 * Provides a fixed, more accurate gasLimit
 * Arbitrum Sepolia has an 'intrinsic gas too low' issue, however if we up the gas limit it works fine
 *
 * @param {number} gasLimit, the original gasLimit, likely from provider.getEstimatedGasLimit()
 * @param {Provider} provider, ethers.js Provider instance
 *
 * @returns {Promise<number>} the new gasLimit
 */
const getFixedGasLimit = async (gasLimit: number, provider: Provider): Promise<number> => {
  // @ts-ignore
  if (CHAIN_IDS.arbitrumSepolia === provider._network.chainId) {
    gasLimit = gasLimit * 2;
  }

  return gasLimit;
};
