import { PopulatedTransaction } from "@ethersproject/contracts";
import { BigNumber } from "ethers";

import { ContractsBlob, ProviderOptions } from "./types";
import { getContracts } from "./utils";

const debug = require("debug")("pt-autotask-lib");

const MIN_PROFIT = 1; // $1.00
const PRIZE_TOKEN_PRICE_USD = 1.02; // $1.02

export async function liquidatorHandleArbSwap(
  contracts: ContractsBlob,
  config: ProviderOptions
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const liquidationPairs = getContracts("LiquidationPair", chainId, provider, contracts);

  if (liquidationPairs.length === 0) {
    throw new Error("LiquidationPairs: Contracts Unavailable");
  }

  const liquidationPair = liquidationPairs[0];

  const maxAmountOut = await liquidationPair.callStatic.maxAmountOut();
  console.log("maxAmountOut ", maxAmountOut);
  console.log("hello!");

  console.log(provider);
  console.log(BigNumber.from(10));
  console.log(maxAmountOut);

  // _account
  // _amountIn
  // _amountOutMin
  console.log(provider, BigNumber.from(10), maxAmountOut);
  const swapExactAmountInComputed = await liquidationPair.callStatic.swapExactAmountIn(
    provider,
    BigNumber.from(10),
    maxAmountOut
  );
  console.log("swapExactAmountInComputed ", swapExactAmountInComputed);

  // replace with real data
  const yieldToken = "MOCK";

  // const relayerYieldTokenBalance = provider.balanceOf(yieldToken);
  const relayerYieldTokenBalance = "MOCK";
  const maxAmountOutWrite = await liquidationPair.maxAmountOut(); // yield token max reserve
  console.log(maxAmountOutWrite);
  const amountOut =
    relayerYieldTokenBalance < maxAmountOut ? relayerYieldTokenBalance : maxAmountOut;

  // Very unclear about what we need to pass as the 3rd arg to swapExactAmountIn
  // I'm guessing this is slippage related, and is the limit we are willing to lose (or gain)
  // in the trade
  const amountOutMax = maxAmountOut; // ?

  // unclear which one of these I need to use just yet
  // const amountOut = await liquidator.computeExactAmountOut(amountIn);
  const amountIn = await liquidationPair.computeExactAmountIn(amountOut);
  const amountInUsd = amountIn * PRIZE_TOKEN_PRICE_USD;

  // Debug Contract Request Parameters
  debug("LiquidationPair computed amount out:", amountOut);

  let transactionPopulated: PopulatedTransaction | undefined;

  const gasCosts = 0.1; // Let's say gas is $0.10 for now ...
  const profit = amountInUsd - gasCosts;
  const profitable = profit > MIN_PROFIT;

  if (profitable) {
    transactionPopulated = await liquidationPair.populateTransaction.swapExactAmountIn(
      provider,
      amountIn,
      amountOutMax
    );
    console.log("LiquidationPair: Swapping");
  } else {
    console.log(
      `LiquidationPair: Could not find a profitable trade.`
      // `LiquidationPair: Could not find a profitable trade.\nCalculated ${n} attempts`,
    );
  }

  return transactionPopulated;
}
