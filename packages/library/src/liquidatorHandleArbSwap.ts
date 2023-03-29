import { PopulatedTransaction } from "@ethersproject/contracts";
import { BigNumber } from "ethers";

import { ContractsBlob, ProviderOptions } from "./types";
import { getContracts } from "./utils";

const debug = require("debug")("pt-autotask-lib");

const MIN_PROFIT = 1; // $1.00
const PRIZE_TOKEN_PRICE_USD = 1.02; // $1.02

export async function liquidatorHandleArbSwap(
  contracts: ContractsBlob,
  config: ProviderOptions,
  swapRecipient: string
): Promise<PopulatedTransaction | undefined> {
  const { chainId, provider } = config;

  const liquidationPairs = getContracts("LiquidationPair", chainId, provider, contracts);

  if (liquidationPairs.length === 0) {
    throw new Error("LiquidationPairs: Contracts Unavailable");
  }

  const liquidationPair = liquidationPairs[0];

  const maxAmountOut = await liquidationPair.callStatic.maxAmountOut();
  console.log("maxAmountOut ", maxAmountOut);
  console.log(swapRecipient);

  // _account
  // _amountIn
  // _amountOutMin
  // const swapExactAmountInComputed = await liquidationPair.callStatic.swapExactAmountIn(
  //   swapRecipient,
  //   BigNumber.from(10),
  //   BigNumber.from(0)
  //   // maxAmountOut
  // );
  // console.log("swapExactAmountInComputed ", swapExactAmountInComputed);

  // const relayerYieldTokenBalance = provider.balanceOf(yieldToken);
  const relayerYieldTokenBalance = "MOCK";

  const amountOut =
    relayerYieldTokenBalance < maxAmountOut ? relayerYieldTokenBalance : maxAmountOut;

  const amountIn = await liquidationPair.callStatic.computeExactAmountIn(amountOut);
  console.log("amountIn:", amountIn);
  // const amountInUsd = amountIn * PRIZE_TOKEN_PRICE_USD;

  let transactionPopulated: PopulatedTransaction | undefined;

  const gasCosts = 0.1; // Let's say gas is $0.10 for now ...
  const profitable = true;
  // const profit = amountInUsd - gasCosts;
  // const profitable = profit > MIN_PROFIT;

  if (profitable) {
    transactionPopulated = await liquidationPair.populateTransaction.swapExactAmountIn(
      swapRecipient,
      amountIn,
      maxAmountOut
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
