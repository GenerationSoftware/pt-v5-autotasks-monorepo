import { providers,ethers, PopulatedTransaction, Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

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

  let tx
  console.log(provider)
  console.log(provider._chainId)
  console.log(provider.chainId)
  if (provider._chainId === CHAIN_IDS.mainnet) {
    // Standard json rpc provider directly from ethers.js (NOT Flashbots)
const provider = new providers.JsonRpcProvider({ url: ETHEREUM_RPC_URL }, 1)

// `authSigner` is an Ethereum private key that does NOT store funds and is NOT your bot's primary key.
// This is an identifying key for signing payloads to establish reputation and whitelisting
// In production, this should be used across multiple bundles to build relationship. In this example, we generate a new wallet each time
const authSigner = Wallet.createRandom();

// Flashbots provider requires passing in a standard provider
const flashbotsProvider = await FlashbotsBundleProvider.create(
  provider, // a normal ethers.js provider, to perform gas estimiations and nonce lookups
  authSigner // ethers.js signer wallet, only for signing request payloads, not transactions
)

    const privateTx = {
      transaction: ...sendTransactionArgs,
      signer: wallet,
    };

    tx = await flashbotsProvider.sendPrivateTransaction(privateTx);
  } else {
    tx = await wallet.sendTransaction(sendTransactionArgs);
  }

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
