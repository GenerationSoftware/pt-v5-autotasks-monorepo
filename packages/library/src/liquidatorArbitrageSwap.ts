import { ethers, Contract, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { Relayer } from 'defender-relay-client';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import { ArbLiquidatorConfigParams, ArbLiquidatorContext, VaultWithContext } from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  getNativeTokenMarketRateUsd,
  roundTwoDecimalPlaces,
  getArbLiquidatorContextMulticall,
  getLiquidationPairsMulticall,
  getLiquidationPairComputeExactAmountInMulticall,
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { canUseIsPrivate, NETWORK_NATIVE_TOKEN_INFO } from './utils/network';

interface SwapExactAmountOutParams {
  liquidationPairAddress: string;
  swapRecipient: string;
  amountOut: BigNumber;
  amountInMin: BigNumber;
  deadline: number;
}

interface Stat {
  pair: string;
  estimatedProfitUsd: number;
  txHash?: string;
  error?: string;
}

/**
 * Iterates through all LiquidationPairs to see if there is any profitable arb opportunities
 *
 * Curently this sends each swap transaction the instant we know if it is profitable
 * or not as we iterate through all LiquidityPairs
 * @returns {undefined} - void function
 */
export async function liquidatorArbitrageSwap(
  contracts: ContractsBlob,
  arbLiquidatorConfigParams: ArbLiquidatorConfigParams,
): Promise<void> {
  const {
    chainId,
    relayer,
    relayerAddress,
    readProvider,
    writeProvider,
    swapRecipient,
    useFlashbots,
    minProfitThresholdUsd,
  } = arbLiquidatorConfigParams;

  // #1. Get contracts
  //
  printSpacer();
  console.log('Starting ...');

  const { liquidationRouterContract, liquidationPairContracts } = await getLiquidationContracts(
    contracts,
    arbLiquidatorConfigParams,
  );

  printSpacer();
  console.log('Collecting information about vaults ...');

  // Loop through all liquidation pairs
  printSpacer();
  console.log(
    chalk.white.bgBlack(` # of Liquidation Pairs (RPC): ${liquidationPairContracts.length} `),
  );
  const stats: Stat[] = [];
  for (let i = 0; i < liquidationPairContracts.length; i++) {
    printSpacer();
    printSpacer();
    printSpacer();
    printAsterisks();
    const liquidationPair = liquidationPairContracts[i];
    console.log(`LiquidationPair #${i + 1}`);
    console.log(chalk.dim(`LiquidationPair Address: ${liquidationPair.address}`));

    const liquidationPairData = contracts.contracts.find(
      (contract) => contract.type === 'LiquidationPair',
    );

    const liquidationPairContract = new ethers.Contract(
      liquidationPair.address,
      liquidationPairData.abi,
      readProvider,
    );

    const context: ArbLiquidatorContext = await getArbLiquidatorContextMulticall(
      liquidationRouterContract,
      liquidationPairContract,
      readProvider,
      relayerAddress,
    );
    const pair = `${context.tokenIn.symbol}/${context.tokenOut.symbol}`;

    printContext(context);
    printAsterisks();

    // #2. Calculate amounts
    console.log(chalk.blue(`1. Amounts:`));

    const { originalMaxAmountOut, wantedAmountsOut } = await calculateAmountOut(
      liquidationPairContract,
      context,
    );
    if (originalMaxAmountOut.eq(0)) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `amountOut is 0`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    const getAmountInValues = async () => {
      try {
        return calculateAmountIn(
          readProvider,
          liquidationPairContract,
          context,
          originalMaxAmountOut,
          wantedAmountsOut,
        );
      } catch (e) {
        console.error(chalk.red(e));

        console.log(chalk.yellow('---'));
        console.log(chalk.yellow('Failed getting amount in!'));
        console.log(chalk.yellow('---'));
      }
    };

    const { amountIn, amountInMin, wantedAmountsIn } = await getAmountInValues();

    if (amountIn.eq(0)) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `amountIn is 0`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #3. Print balance of tokenIn for relayer
    // TODO: Fix this to only use the selectedIndex amountIn
    const sufficientBalance = await checkBalance(context, amountIn);

    if (sufficientBalance) {
      console.log(chalk.green('Sufficient balance ✔'));
    } else {
      console.log(chalk.red('Insufficient balance ✗'));

      const diff = amountIn.sub(context.relayer.tokenInBalance);
      const increaseAmount = ethers.utils.formatUnits(diff, context.tokenIn.decimals);
      const errorMsg = `Relayer ${
        context.tokenIn.symbol
      } balance insufficient by ${roundTwoDecimalPlaces(Number(increaseAmount))}`;
      console.log(
        chalk.red(
          `Increase relayer '${relayerAddress}' ${context.tokenIn.symbol} balance by ${increaseAmount}`,
        ),
      );

      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: errorMsg,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #4. Get allowance approval (necessary before upcoming static call)
    //
    await approve(amountIn, liquidationRouterContract, writeProvider, relayerAddress, context);

    // #5. Find an estimated amount of gas cost
    const swapExactAmountOutParams: SwapExactAmountOutParams = {
      liquidationPairAddress: liquidationPair.address,
      swapRecipient,
      amountOut: originalMaxAmountOut,
      amountInMin,
      deadline: Math.floor(Date.now() / 1000) + 100,
    };

    let avgFeeUsd = 0;
    try {
      avgFeeUsd = await getGasCost(
        chainId,
        liquidationRouterContract,
        swapExactAmountOutParams,
        readProvider,
      );
    } catch (e) {
      console.error(chalk.red(e));

      console.log(chalk.yellow('---'));
      console.log(chalk.yellow('Could not estimate gas costs!'));
      console.log(chalk.yellow('---'));

      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Could not get gas cost`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #6. Decide if profitable or not
    const { estimatedProfitUsd, profitable, selectedIndex } = await calculateProfit(
      context,
      minProfitThresholdUsd,
      wantedAmountsIn,
      wantedAmountsOut,
      avgFeeUsd,
    );
    if (!profitable) {
      console.log(
        chalk.red(
          `Liquidation Pair ${context.tokenIn.symbol}/${context.tokenOut.symbol}: currently not a profitable trade.`,
        ),
      );
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Not profitable`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #7. Finally, populate tx when profitable
    try {
      let transactionPopulated: PopulatedTransaction | undefined;
      console.log(chalk.blue('6. Populating swap transaction ...'));
      printSpacer();

      // Re-create the params for the swap tx, this time using the dynamically chosen amountOut
      // based on the maximum amount of profit
      const swapExactAmountOutParams: SwapExactAmountOutParams = {
        liquidationPairAddress: liquidationPair.address,
        swapRecipient,
        amountOut: wantedAmountsOut[selectedIndex],
        amountInMin,
        deadline: Math.floor(Date.now() / 1000) + 100,
      };

      transactionPopulated = await liquidationRouterContract.populateTransaction.swapExactAmountOut(
        ...Object.values(swapExactAmountOutParams),
      );

      const isPrivate = canUseIsPrivate(chainId, useFlashbots);
      console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));

      let transactionSentToNetwork = await relayer.sendTransaction({
        isPrivate,
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 1000000,
      });
      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', transactionSentToNetwork.hash));

      stats.push({
        pair,
        estimatedProfitUsd,
        txHash: transactionSentToNetwork.hash,
      });
    } catch (error) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: error.message,
      });
      throw new Error(error);
    }
  }

  printSpacer();
  printSpacer();
  printAsterisks();
  console.log(chalk.greenBright.bold(`SUMMARY`));
  console.table(stats);
  const estimatedProfitUsdTotal = stats.reduce((accumulator, stat) => {
    return accumulator + stat.estimatedProfitUsd;
  }, 0);
  console.log(
    chalk.greenBright.bold(`ESTIMATED PROFIT: $${roundTwoDecimalPlaces(estimatedProfitUsdTotal)}`),
  );
}

/**
 * Allowance - Give permission to the LiquidationRouter to spend our Relayer/SwapRecipient's
 * `tokenIn` (likely POOL). We will set allowance to max as we trust the security of the
 * LiquidationRouter contract (you may want to change this!)
 * @returns {undefined} - void function
 */
const approve = async (
  amountIn: BigNumber,
  liquidationRouter: Contract,
  writeProvider: Provider | DefenderRelaySigner,
  relayerAddress: string,
  context: ArbLiquidatorContext,
) => {
  try {
    printSpacer();
    console.log("Checking 'tokenIn' ERC20 allowance...");

    const tokenInAddress = context.tokenIn.address;
    const token = new ethers.Contract(tokenInAddress, ERC20Abi, writeProvider);

    const allowance = context.relayer.tokenInAllowance;

    if (allowance.lt(amountIn)) {
      console.log(
        chalk.bgBlack.yellowBright(
          `Increasing relayer '${relayerAddress}' ${context.tokenIn.symbol} allowance for the LiquidationRouter to maximum ...`,
        ),
      );

      const tx = await token.approve(liquidationRouter.address, ethers.constants.MaxInt256);
      await tx.wait();

      const newAllowanceResult = await token.functions.allowance(
        relayerAddress,
        liquidationRouter.address,
      );
      logStringValue('New allowance:', newAllowanceResult[0].toString());
    } else {
      console.log(chalk.green('Sufficient allowance ✔'));
    }
  } catch (error) {
    console.log(chalk.red('error: ', error));
  }
};

/**
 * Find and initialize the various contracts we will need for all liquidation pairs
 * @returns {Promise} All of the LiquidationPair contracts, the LiquidationRouter contract
 *                    and the MarketRate contract initialized as ethers contracts
 */
const getLiquidationContracts = async (
  contracts: ContractsBlob,
  params: ArbLiquidatorConfigParams,
): Promise<{
  liquidationRouterContract: Contract;
  liquidationPairContracts: Contract[];
}> => {
  const { chainId, readProvider, writeProvider } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  const liquidationPairFactoryContract = getContract(
    'LiquidationPairFactory',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );
  const liquidationPairContracts = await getLiquidationPairsMulticall(
    liquidationPairFactoryContract,
    readProvider,
  );

  const liquidationRouterContract = getContract(
    'LiquidationRouter',
    chainId,
    writeProvider,
    contracts,
    contractsVersion,
  );

  return { liquidationRouterContract, liquidationPairContracts };
};

const printContext = (context) => {
  printAsterisks();
  console.log(chalk.blue(`Liquidation Pair: ${context.tokenIn.symbol}/${context.tokenOut.symbol}`));
  printSpacer();

  logTable({
    tokenIn: context.tokenIn,
    tokenOut: context.tokenOut,
    underlyingAssetToken: context.underlyingAssetToken,
  });
  logBigNumber(
    `Relayer ${context.tokenIn.symbol} balance:`,
    context.relayer.tokenInBalance,
    context.tokenIn.decimals,
    context.tokenIn.symbol,
  );
  logBigNumber(
    `Relayer ${context.tokenIn.symbol} allowance:`,
    context.relayer.tokenInAllowance,
    context.tokenIn.decimals,
    context.tokenIn.symbol,
  );
};

/**
 * Tests if the relayer has enough of the tokenIn to swap
 * @returns {Promise} Promise boolean if the balance is sufficient to swap
 */
const checkBalance = async (
  context: ArbLiquidatorContext,
  exactAmountIn: BigNumber,
): Promise<boolean> => {
  printAsterisks();
  console.log(chalk.blue('2. Balance & Allowance'));
  console.log("Checking relayer 'tokenIn' balance ...");

  const tokenInBalance = context.relayer.tokenInBalance;
  const sufficientBalance = tokenInBalance.gt(exactAmountIn);

  return sufficientBalance;
};

/**
 * Calculates the amount of profit the bot will make on this swap and if it's profitable or not
 * @returns {Promise} Promise boolean of profitability
 */
const calculateProfit = async (
  context: ArbLiquidatorContext,
  minProfitThresholdUsd: number,
  wantedAmountsIn: BigNumber[],
  wantedAmountsOut: BigNumber[],
  avgFeeUsd: number,
): Promise<{ estimatedProfitUsd: number; profitable: boolean; selectedIndex: number }> => {
  printAsterisks();
  console.log(chalk.blue('5. Profit/Loss (USD):'));
  printSpacer();

  console.log(chalk.blueBright('Gross profit = tokenOut - tokenIn'));
  const grossProfitsUsd = [];
  for (let i = 0; i < wantedAmountsIn.length; i++) {
    const amountOut = wantedAmountsOut[i];
    const amountIn = wantedAmountsIn[i];

    const underlyingAssetTokenUsd =
      parseFloat(ethers.utils.formatUnits(amountOut, context.tokenOut.decimals)) *
      context.underlyingAssetToken.assetRateUsd;
    const tokenInUsd =
      parseFloat(ethers.utils.formatUnits(amountIn, context.tokenIn.decimals)) *
      context.tokenIn.assetRateUsd;

    const grossProfitUsd = underlyingAssetTokenUsd - tokenInUsd;

    console.log(
      chalk.dim(`Index ${i}:`),
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(grossProfitUsd)} = $${roundTwoDecimalPlaces(
          underlyingAssetTokenUsd,
        )} - $${roundTwoDecimalPlaces(tokenInUsd)}`,
      ),
    );

    grossProfitsUsd.push(grossProfitUsd);
  }
  printSpacer();

  const getMaxGrossProfit = (grossProfitsUsd: number[]) => {
    const max = grossProfitsUsd.reduce((a, b) => Math.max(a, b), -Infinity);
    return { maxGrossProfit: max, selectedIndex: grossProfitsUsd.indexOf(max) };
  };

  const { selectedIndex, maxGrossProfit } = getMaxGrossProfit(grossProfitsUsd);
  console.log(
    chalk.dim(`Selected Index ${selectedIndex} -`),
    chalk.blueBright(`$${roundTwoDecimalPlaces(maxGrossProfit)}`),
  );
  printSpacer();

  const netProfitUsd = maxGrossProfit - avgFeeUsd;

  console.log(chalk.magenta('Net profit = Gross profit - Gas fee (Average)'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = $${roundTwoDecimalPlaces(
        maxGrossProfit,
      )} - $${roundTwoDecimalPlaces(avgFeeUsd)}`,
    ),
  );
  printSpacer();

  const profitable = netProfitUsd > minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${minProfitThresholdUsd}`,
    'Net profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    'Profitable?': profitable ? '✔' : '✗',
  });
  printSpacer();

  const estimatedProfitUsd = roundTwoDecimalPlaces(netProfitUsd);

  return { estimatedProfitUsd, profitable, selectedIndex };
};

/**
 * Get the gas cost for the tx
 * @returns {Promise} Promise with the maximum gas fee in USD
 */
const getGasCost = async (
  chainId: number,
  liquidationRouter: Contract,
  swapExactAmountOutParams: SwapExactAmountOutParams,
  readProvider: Provider,
): Promise<number> => {
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  printAsterisks();
  console.log(chalk.blue('4. Current gas costs for transaction:'));

  const estimatedGasLimit = await liquidationRouter.estimateGas.swapExactAmountOut(
    ...Object.values(swapExactAmountOutParams),
  );

  const populatedTx = await liquidationRouter.populateTransaction.swapExactAmountOut(
    ...Object.values(swapExactAmountOutParams),
  );
  const { avgFeeUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    nativeTokenMarketRateUsd,
    readProvider,
    populatedTx.data,
  );
  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${nativeTokenMarketRateUsd}`,
  );

  printSpacer();
  logBigNumber(
    'Estimated gas limit (wei):',
    estimatedGasLimit,
    18,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );

  logTable({ avgFeeUsd });

  return avgFeeUsd;
};

/**
 * Calculates necessary input parameters for the swap call based on current state of the contracts
 * @returns {Promise} Promise object with the input parameters exactAmountIn and amountOutMin
 */
const calculateAmountOut = async (
  liquidationPair: Contract,
  context: ArbLiquidatorContext,
): Promise<{
  originalMaxAmountOut: BigNumber;
  wantedAmountsOut: BigNumber[];
}> => {
  const wantedAmountsOut = [];

  const amountOut = await liquidationPair.callStatic.maxAmountOut();
  logBigNumber(
    `Max amount out available:`,
    amountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol,
  );

  if (amountOut.eq(0)) {
    console.warn(
      chalk.bgBlack.yellowBright(
        `Max amount out available is 0: (Not enough interest accrued ... Is yield deposited and draws have completed?)`,
      ),
    );
    return {
      originalMaxAmountOut: BigNumber.from(0),
      wantedAmountsOut,
    };
  }

  // Get multiple points across the auction function to determine the most amount of profitability
  // most amount out for least amount of token in
  // (depending on the state of the gradual auction)
  printSpacer();
  for (let i = 1; i <= 100; i++) {
    const amountToSendPercent = i;
    // const amountToSendPercent = i * 10; when number of divisions is 10, instead of 100
    const wantedAmountOut = amountOut.mul(ethers.BigNumber.from(amountToSendPercent)).div(100);

    // logBigNumber(
    //   'Wanted amount out:',
    //   wantedAmountOut,
    //   context.tokenOut.decimals,
    //   context.tokenOut.symbol,
    // );

    wantedAmountsOut.push(wantedAmountOut);
  }

  return {
    originalMaxAmountOut: amountOut,
    wantedAmountsOut,
  };
};

/**
 * Calculates necessary input parameters for the swap call based on current state of the contracts
 * @returns {Promise} Promise object with the input parameters exactAmountIn and amountOutMin
 */
const calculateAmountIn = async (
  readProvider: Provider,
  liquidationPairContract: Contract,
  context: ArbLiquidatorContext,
  originalMaxAmountOut: BigNumber,
  wantedAmountsOut: BigNumber[],
): Promise<{
  amountIn: BigNumber;
  amountInMin: BigNumber;
  wantedAmountsIn: BigNumber[];
}> => {
  printSpacer();

  let wantedAmountsIn = [];

  const amountIn: BigNumber = await liquidationPairContract.callStatic.computeExactAmountIn(
    originalMaxAmountOut,
  );
  logBigNumber('Amount in:', amountIn, context.tokenIn.decimals, context.tokenIn.symbol);

  const amountInMin = ethers.constants.MaxInt256;

  if (amountIn.eq(0)) {
    return {
      amountIn,
      amountInMin,
      wantedAmountsIn,
    };
  }

  wantedAmountsIn = await getLiquidationPairComputeExactAmountInMulticall(
    liquidationPairContract,
    wantedAmountsOut,
    readProvider,
  );

  return {
    amountIn,
    amountInMin,
    wantedAmountsIn,
  };
};

const logNextPair = (liquidationPair, liquidationPairContracts) => {
  if (liquidationPair !== liquidationPairContracts[liquidationPairContracts.length - 1]) {
    console.warn(chalk.yellow(`Moving to next pair ...`));
  }
};
