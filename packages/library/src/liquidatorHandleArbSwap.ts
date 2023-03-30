import { PopulatedTransaction } from "@ethersproject/contracts";
import { BigNumber } from "ethers";
import { ethers } from "ethers";

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
  const { chainId, provider } = config;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const liquidationRouter = getContract(
    "LiquidationRouter",
    chainId,
    provider,
    contracts,
    contractsVersion
  );
  const liquidationPairs = getContracts(
    "LiquidationPair",
    chainId,
    provider,
    contracts,
    contractsVersion
  );

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

  // Allowance
  // Give permission to the LiquidationRouter to spend our Relayer/SwapRecipient's `tokenIn` (likely POOL)
  // We will set allowance to max as we trust the security of the LiquidationRouter contract
  // Only set allowance if there isn't one already set ...

  const tokenInAddress = await liquidationPair.tokenIn();
  console.log({ tokenInAddress });
  const token = new ethers.Contract(tokenInAddress, ERC20Abi, provider);
  console.log("maxint", ethers.constants.MaxInt256);

  let allowanceResult = await token.functions.allowance(swapRecipient, liquidationRouter.address);
  console.log("allowanceResult", allowanceResult);

  console.log(swapRecipient, liquidationRouter.address, ethers.constants.MaxInt256);

  const approveResult = await token.functions.approve(
    liquidationRouter.address,
    ethers.constants.MaxInt256
  );
  console.log("approveResult", approveResult);

  allowanceResult = await token.functions.allowance(swapRecipient, liquidationRouter.address);
  console.log("allowanceResult", allowanceResult);

  // const txWillSucceed = true;
  const txWillSucceed = await liquidationRouter.callStatic.swapExactAmountIn(
    liquidationPair.address,
    swapRecipient,
    exactAmountIn,
    amountOutMin
  );
  console.log("txWillSucceed", txWillSucceed);

  if (profitable && txWillSucceed) {
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

// const approve = async () => {
//   try {
//     const token = new ethers.Contract(TOKEN_ADDRESS, erc20ABI, signer);
//     // const decimals = await token.decimals()
//     // const decimalAmount = ethers.utils.parseUnits(lockAmount, decimals)
//     const tx = await token.approve(CONTRACT, ethers.constants.MaxInt256);
//     await tx.wait();
//   } catch (error) {
//     console.log("error: ", error);
//   }
// };
