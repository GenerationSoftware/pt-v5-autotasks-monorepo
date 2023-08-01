import { ethers, Contract, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { Relayer } from 'defender-relay-client';
import { ContractsBlob, getContract, getContracts } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import { ArbLiquidatorConfigParams, ArbLiquidatorContext } from './types';
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
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { canUseIsPrivate, NETWORK_NATIVE_TOKEN_INFO } from './utils/network';

interface SwapExactAmountInParams {
  liquidationPairAddress: string;
  swapRecipient: string;
  exactAmountIn: BigNumber;
  amountOutMin: BigNumber;
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
 * Curently this does not return PopulatedTransactions like the other bots as
 * we want to send each swap transaction the instant we know if it is profitable
 * or not as we iterate through all LiquidityPairs.
 * @returns {undefined} - void function
 */
export async function liquidatorArbitrageSwap(
  contracts: ContractsBlob,
  relayer: Relayer,
  params: ArbLiquidatorConfigParams,
) {
  const {
    chainId,
    relayerAddress,
    readProvider,
    writeProvider,
    swapRecipient,
    useFlashbots,
    minProfitThresholdUsd,
  } = params;

  // #1. Get contracts
  //
  const { liquidationPairs, liquidationRouter, marketRate } = await getLiquidationContracts(
    contracts,
    params,
  );

  // Loop through all liquidation pairs
  printSpacer();
  console.log(chalk.white.bgBlack(` # of Liquidation Pairs: ${liquidationPairs.length} `));
  const stats: Stat[] = [];
  for (let i = 0; i < liquidationPairs.length; i++) {
    printSpacer();
    printSpacer();
    printSpacer();
    printAsterisks();
    const liquidationPair = liquidationPairs[i];
    console.log(`LiquidationPair #${i + 1}`);
    console.log(liquidationPair.address);

    const context: ArbLiquidatorContext = await getContext(
      marketRate,
      liquidationRouter,
      liquidationPair,
      contracts,
      readProvider,
      relayerAddress,
    );
    const pair = `${context.tokenIn.symbol}/${context.tokenOut.symbol}`;

    printContext(context);
    printAsterisks();

    // #2. Calculate amounts
    //
    console.log(chalk.blue(`1. Amounts:`));

    const { exactAmountIn, amountOutMin } = await calculateAmounts(liquidationPair, context);
    if (amountOutMin.eq(0)) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `amountOutMin is 0`,
      });
      logNextPair(liquidationPair, liquidationPairs);
      continue;
    }

    // #3. Print balance of tokenIn for relayer
    //
    const sufficientBalance = await checkBalance(context, exactAmountIn);

    if (sufficientBalance) {
      console.log(chalk.green('Sufficient balance ✔'));
    } else {
      console.log(chalk.red('Insufficient balance ✗'));

      const diff = exactAmountIn.sub(context.relayer.tokenInBalance);
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
      logNextPair(liquidationPair, liquidationPairs);
      continue;
    }

    // #4. Get allowance approval (necessary before upcoming static call)
    //
    await approve(exactAmountIn, liquidationRouter, writeProvider, relayerAddress, context);

    // #5. Test tx to get estimated return of tokenOut
    //
    printAsterisks();
    console.log(chalk.blue.bold(`3. Getting amount to receive ...`));
    const swapExactAmountInParams: SwapExactAmountInParams = {
      liquidationPairAddress: liquidationPair.address,
      swapRecipient,
      exactAmountIn,
      amountOutMin,
    };

    let amountOutEstimate;
    try {
      amountOutEstimate = await liquidationRouter.callStatic.swapExactAmountIn(
        ...Object.values(swapExactAmountInParams),
      );
    } catch (e) {
      console.error(chalk.red(e));
      console.warn(chalk.yellow(`Unable to retrieve 'amountOutEstimate' from contract.`));
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Unable to retrieve 'amountOutEstimate' from contract`,
      });
      logNextPair(liquidationPair, liquidationPairs);
      continue;
    }
    logBigNumber(
      `Estimated amount of tokenOut to receive:`,
      amountOutEstimate,
      context.tokenOut.decimals,
      context.tokenOut.symbol,
    );

    // #6. Decide if profitable or not
    //
    const { estimatedProfitUsd, profitable } = await calculateProfit(
      chainId,
      liquidationRouter,
      swapExactAmountInParams,
      readProvider,
      context,
      minProfitThresholdUsd,
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
      logNextPair(liquidationPair, liquidationPairs);
      continue;
    }

    // #7. Finally, populate tx when profitable
    try {
      let transactionPopulated: PopulatedTransaction | undefined;
      console.log(chalk.blue('6. Populating swap transaction ...'));
      printSpacer();

      transactionPopulated = await liquidationRouter.populateTransaction.swapExactAmountIn(
        ...Object.values(swapExactAmountInParams),
      );

      const isPrivate = canUseIsPrivate(chainId, useFlashbots);
      console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));

      let transactionSentToNetwork = await relayer.sendTransaction({
        isPrivate,
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 600000,
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
  exactAmountIn: BigNumber,
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

    if (allowance.lt(exactAmountIn)) {
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
  liquidationPairs: Contract[];
  liquidationRouter: Contract;
  marketRate: Contract;
}> => {
  const { chainId, readProvider, writeProvider } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  const liquidationPairFactory = getContract(
    'LiquidationPairFactory',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );
  const liquidationPairs = await getLiquidationPairsMulticall(liquidationPairFactory, readProvider);

  const liquidationRouter = getContract(
    'LiquidationRouter',
    chainId,
    writeProvider,
    contracts,
    contractsVersion,
  );
  const marketRate = getContract('MarketRate', chainId, readProvider, contracts, contractsVersion);

  return { liquidationPairs, liquidationRouter, marketRate };
};

/**
 * Gather information about this specific liquidation pair
 * `tokenIn` is the token to supply (likely the prize token, which is probably POOL),
 * This gets complicated because `tokenOut` is the Vault/Yield token, not the
 * underlying asset which is likely the desired token (ie. DAI, USDC) - the desired
 * token is called `tokenOutUnderlyingAsset`
 * @returns {Promise} Promise of an ArbLiquidatorContext object with all the data about this pair
 */
const getContext = async (
  marketRate: Contract,
  liquidationRouter: Contract,
  liquidationPair: Contract,
  contracts: ContractsBlob,
  readProvider: Provider,
  relayerAddress: string,
): Promise<ArbLiquidatorContext> => {
  const context: ArbLiquidatorContext = await getArbLiquidatorContextMulticall(
    marketRate,
    liquidationRouter,
    liquidationPair,
    contracts,
    readProvider,
    relayerAddress,
  );

  return context;
};

const printContext = (context) => {
  printAsterisks();
  console.log(chalk.blue(`Liquidation Pair: ${context.tokenIn.symbol}/${context.tokenOut.symbol}`));
  printSpacer();

  logTable({
    tokenIn: context.tokenIn,
    tokenOut: context.tokenOut,
    tokenOutUnderlyingAsset: context.tokenOutUnderlyingAsset,
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
  chainId: number,
  liquidationRouter: Contract,
  swapExactAmountInParams: SwapExactAmountInParams,
  readProvider: Provider,
  context: ArbLiquidatorContext,
  minProfitThresholdUsd: number,
): Promise<{ estimatedProfitUsd: number; profitable: boolean }> => {
  const { amountOutMin, exactAmountIn } = swapExactAmountInParams;

  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  printAsterisks();
  console.log(chalk.blue('4. Current gas costs for transaction:'));

  let estimatedGasLimit;
  try {
    estimatedGasLimit = await liquidationRouter.estimateGas.swapExactAmountIn(
      ...Object.values(swapExactAmountInParams),
    );
  } catch (e) {
    console.error(chalk.red(e));
  }
  const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    nativeTokenMarketRateUsd,
    readProvider,
  );
  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${nativeTokenMarketRateUsd}`,
  );

  printSpacer();
  logBigNumber(
    'Estimated gas limit:',
    estimatedGasLimit,
    18,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );

  logTable({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

  printAsterisks();
  console.log(chalk.blue('5. Profit/Loss (USD):'));
  printSpacer();

  const tokenOutUnderlyingAssetUsd =
    parseFloat(ethers.utils.formatUnits(amountOutMin, context.tokenOut.decimals)) *
    context.tokenOutUnderlyingAsset.assetRateUsd;
  const tokenInUsd =
    parseFloat(ethers.utils.formatUnits(exactAmountIn, context.tokenIn.decimals)) *
    context.tokenIn.assetRateUsd;

  const grossProfitUsd = tokenOutUnderlyingAssetUsd - tokenInUsd;
  const netProfitUsd = grossProfitUsd - maxFeeUsd;

  console.log(chalk.magenta('Gross profit = tokenOut - tokenIn'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(grossProfitUsd)} = $${roundTwoDecimalPlaces(
        tokenOutUnderlyingAssetUsd,
      )} - $${roundTwoDecimalPlaces(tokenInUsd)}`,
    ),
  );
  printSpacer();

  console.log(chalk.magenta('Net profit = Gross profit - Gas fee (Max)'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = $${roundTwoDecimalPlaces(
        grossProfitUsd,
      )} - $${roundTwoDecimalPlaces(maxFeeUsd)}`,
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

  return { estimatedProfitUsd: roundTwoDecimalPlaces(netProfitUsd), profitable };
};

/**
 * Calculates necessary input parameters for the swap call based on current state of the contracts
 * @returns {Promise} Promise object with the input parameters exactAmountIn and amountOutMin
 */
const calculateAmounts = async (
  liquidationPair: Contract,
  context: ArbLiquidatorContext,
): Promise<{
  exactAmountIn: BigNumber;
  amountOutMin: BigNumber;
}> => {
  const maxAmountOut = await liquidationPair.callStatic.maxAmountOut();
  logBigNumber(
    `Max amount out available:`,
    maxAmountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol,
  );

  if (maxAmountOut.eq(0)) {
    console.warn(
      chalk.bgBlack.yellowBright(
        `Max amount out available is 0: (Not enough interest accrued ... Is yield deposited and draws have completed?)`,
      ),
    );
    return {
      exactAmountIn: BigNumber.from(0),
      amountOutMin: BigNumber.from(0),
    };
  }
  // Needs to be based on how much the bot owner has of tokenIn
  // as well as how big of a trade they're willing to do
  // TODO: Should this be calculated automatically or a config param?
  // const divisor = 100;
  const divisor = 50;
  // if (divisor !== 1) {
  logStringValue('Divide max amount out by:', Math.round(divisor));
  // }
  const wantedAmountOut = maxAmountOut.div(divisor);
  // const wantedAmountOut = maxAmountOut;
  logBigNumber(
    'Wanted amount out:',
    wantedAmountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol,
  );
  printSpacer();

  const exactAmountIn = await liquidationPair.callStatic.computeExactAmountIn(wantedAmountOut);
  logBigNumber('Exact amount in:', exactAmountIn, context.tokenIn.decimals, context.tokenIn.symbol);

  const amountOutMin = await liquidationPair.callStatic.computeExactAmountOut(exactAmountIn);
  logBigNumber(
    'Amount out minimum:',
    amountOutMin,
    context.tokenOut.decimals,
    context.tokenOut.symbol,
  );

  return {
    exactAmountIn,
    amountOutMin,
  };
};

const logNextPair = (liquidationPair, liquidationPairs) => {
  if (liquidationPair !== liquidationPairs[liquidationPairs.length - 1]) {
    console.warn(chalk.yellow(`Moving to next pair ...`));
  }
};
