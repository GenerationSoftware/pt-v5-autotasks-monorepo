import { PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, ProviderOptions } from './types';
import { getContract } from './utils';

const debug = require('debug')('pt-autotask-lib');

const MIN_PROFIT = 1 // $1.00
const PRIZE_TOKEN_PRICE_USD = 1.02 // $1.02

export async function liquidatorHandleArbSwap(
  contracts: ContractsBlob,
  config: ProviderOptions,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const liquidator = getContract('Liquidator', chainId, provider, contracts);

  if (!liquidator) {
    throw new Error('Liquidator: Contract Unavailable');
  }

  const relayerYieldTokenBalance = provider.balanceOf(yieldToken)
  const maxAmountOut = await liquidator.maxAmountOut(); // yield token max reserve
  const amountOut = relayerYieldTokenBalance < maxAmountOut ? relayerYieldTokenBalance : maxAmountOut 


  // Very unclear about what we need to pass as the 3rd arg to swapExactAmountIn
  // I'm guessing this is slippage related, and is the limit we are willing to lose (or gain)
  // in the trade
  const amountOutMax = maxAmountOut // ?

  // unclear which one of these I need to use just yet
  // const amountOut = await liquidator.computeExactAmountOut(amountIn);
  const amountIn = await liquidator.computeExactAmountIn(amountOut);
  const amountInUsd = amountIn * PRIZE_TOKEN_PRICE_USD

  // Debug Contract Request Parameters
  debug('Liquidator computed amount out:', amountOut);

  let transactionPopulated: PopulatedTransaction | undefined;

  const gasCosts = 0.1 // Let's say gas is $0.10 for now ...
  const profit = amountInUsd - gasCosts
  const profitable = profit > MIN_PROFIT

  if (profitable) {
    console.log('Liquidator: Swapping');
    transactionPopulated = await liquidator.populateTransaction.swapExactAmountIn(
      provider,
      amountIn,
      amountOutMax
    );
  } else {
    console.log(
      `Liquidator: Could not find a profitable trade.\nCalculated ${n} attempts`,
    );
  }

  return transactionPopulated;
}
