import { ethers, Contract } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { ContractsBlob, ProviderOptions } from "./types";
import { getContract, getContracts } from "./utils";
import { ERC20Abi } from "./abis/ERC20Abi";

const debug = require("debug")("pt-autotask-lib");

const MIN_PROFIT = 1; // $1.00
const PRIZE_TOKEN_PRICE_USD = 1.02; // $1.02

export async function liquidatorHandleArbSwap(
  contracts: ContractsBlob,
  config: ProviderOptions,
  swapRecipient: string
): Promise<PopulatedTransaction | undefined> {
  const { provider } = config;

  const { liquidationPairs, liquidationRouter } = getLiquidationContracts(contracts, config);

  // process the first (change this to loop)
  const liquidationPair = liquidationPairs[0];

  const maxAmountOut = await liquidationPair.callStatic.maxAmountOut();
  console.log("maxAmountOut ", maxAmountOut);
  console.log(swapRecipient);

  // const amountIn = await liquidationPair.callStatic.computeExactAmountIn(maxAmountOut);
  // console.log("amountIn:", amountIn);

  // const amountInUsd = amountIn * PRIZE_TOKEN_PRICE_USD;

  let transactionPopulated: PopulatedTransaction | undefined;

  const gasCosts = 0.1; // Let's say gas is $0.10 for now ...
  const profitable = true;
  // const profit = amountInUsd - gasCosts;
  // const profitable = profit > MIN_PROFIT;

  const wantedAmountOut = maxAmountOut.div(10);
  console.log("*************");
  console.log(maxAmountOut.toString());
  console.log(wantedAmountOut.toString());
  const exactAmountIn = liquidationPair.callStatic.computeExactAmountIn(wantedAmountOut);
  const amountOutMin = liquidationPair.callStatic.computeExactAmountOut(exactAmountIn);

  // #3
  await approve(liquidationPair, liquidationRouter, swapRecipient, provider);

  // #4. Test tx and get estimated return of tokenOut
  const amountOutEstimate = await liquidationRouter.callStatic.swapExactAmountIn(
    liquidationPair.address,
    swapRecipient,
    exactAmountIn,
    amountOutMin
  );
  console.log("amountOutEstimate", amountOutEstimate);

  if (profitable) {
    console.log(swapRecipient, exactAmountIn.toString(), amountOutMin.toString());

    transactionPopulated = await liquidationRouter.populateTransaction.swapExactAmountIn(
      liquidationPair.address,
      swapRecipient,
      exactAmountIn,
      amountOutMin
    );
    console.log("LiquidationPair: Swapping");
  } else {
    console.log(`LiquidationPair: Could not find a profitable trade.`);
  }

  return transactionPopulated;
}

// Allowance
// Give permission to the LiquidationRouter to spend our Relayer/SwapRecipient's `tokenIn` (likely POOL)
// We will set allowance to max as we trust the security of the LiquidationRouter contract
// Only set allowance if there isn't one already set ...
const approve = async (
  liquidationPair: Contract,
  liquidationRouter: Contract,
  swapRecipient: string,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider
) => {
  try {
    const tokenInAddress = await liquidationPair.tokenIn();
    console.log({ tokenInAddress });
    const token = new ethers.Contract(tokenInAddress, ERC20Abi, provider);
    console.log("maxint", ethers.constants.MaxInt256);

    let allowanceResult = await token.functions.allowance(swapRecipient, liquidationRouter.address);
    console.log("allowanceResult", allowanceResult);

    console.log(swapRecipient, liquidationRouter.address, ethers.constants.MaxInt256);

    const tx = await token.approve(liquidationRouter.address, ethers.constants.MaxInt256);
    await tx.wait();
    console.log("approve tx", tx);

    allowanceResult = await token.functions.allowance(swapRecipient, liquidationRouter.address);
    console.log("allowanceResult", allowanceResult);
  } catch (error) {
    console.log("error: ", error);
  }
};

const getLiquidationContracts = (
  contracts: ContractsBlob,
  config: ProviderOptions
): { liquidationPairs: Contract[]; liquidationRouter: Contract } => {
  const { chainId, provider } = config;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  const liquidationPairs = getContracts(
    "LiquidationPair",
    chainId,
    provider,
    contracts,
    contractsVersion
  );
  const liquidationRouter = getContract(
    "LiquidationRouter",
    chainId,
    provider,
    contracts,
    contractsVersion
  );

  return { liquidationPairs, liquidationRouter };
};
