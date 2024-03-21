import { ethers, Contract, BigNumber, Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { DefenderRelaySigner } from '@openzeppelin/defender-relay-client/lib/ethers';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import { LiquidatorConfig, LiquidatorContext } from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  getNativeTokenMarketRateUsd,
  roundTwoDecimalPlaces,
  getLiquidatorContextMulticall,
  getLiquidationPairsMulticall,
  getLiquidationPairComputeExactAmountInMulticall,
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { NETWORK_NATIVE_TOKEN_INFO } from './constants/network';
import { LIQUIDATION_TOKEN_ALLOW_LIST } from './constants/tokens';
import { sendPopulatedTx } from './helpers/sendPopulatedTx';

interface SwapExactAmountOutParams {
  liquidationPairAddress: string;
  swapRecipient: string;
  amountOut: BigNumber;
  amountInMax: BigNumber;
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
export async function runLiquidator(
  contracts: ContractsBlob,
  config: LiquidatorConfig,
): Promise<void> {
  const {
    chainId,
    provider,
    ozRelayer,
    wallet,
    signer,
    relayerAddress,
    swapRecipient,
    useFlashbots,
    minProfitThresholdUsd,
    covalentApiKey,
  } = config;

  console.log('Config - MIN_PROFIT_THRESHOLD_USD:', config.minProfitThresholdUsd);

  // #1. Get contracts
  //
  printSpacer();
  console.log('Starting ...');

  const { liquidationRouterContract, liquidationPairContracts } = await getLiquidationContracts(
    contracts,
    config,
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
      provider,
    );

    const context: LiquidatorContext = await getLiquidatorContextMulticall(
      liquidationRouterContract,
      liquidationPairContract,
      provider,
      relayerAddress,
      covalentApiKey,
    );
    const pair = `${context.tokenIn.symbol}/${context.tokenOut.symbol}`;

    printContext(context);
    printAsterisks();
    printSpacer();

    const tokenOutInAllowList = tokenOutAllowListed(chainId, context);
    if (!tokenOutInAllowList) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `tokenOut '${
          context.tokenOut.symbol
        }' (CA: ${context.tokenOut.address.toLowerCase()}) not in token allow list`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);

      continue;
    }
    printSpacer();

    // #2. Calculate amounts
    console.log(chalk.blue(`1. Amounts:`));

    const { originalMaxAmountOut, wantedAmountsOut } = await calculateAmountOut(
      liquidationPairContract,
      context,
    );

    if (!context.underlyingAssetToken.assetRateUsd) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Could not get underlying asset USD value to calculate profit with`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

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
          provider,
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

    const { amountIn, amountInMax, wantedAmountsIn } = await getAmountInValues();

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
    await approve(amountIn, liquidationRouterContract, signer, relayerAddress, context);

    // #5. Find an estimated amount of gas cost
    const swapExactAmountOutParams: SwapExactAmountOutParams = {
      liquidationPairAddress: liquidationPair.address,
      swapRecipient,
      amountOut: originalMaxAmountOut,
      amountInMax,
      deadline: Math.floor(Date.now() / 1000) + 100,
    };

    let avgFeeUsd = 0;
    try {
      avgFeeUsd = await getGasCost(
        chainId,
        liquidationRouterContract,
        swapExactAmountOutParams,
        provider,
      );
    } catch (e) {
      console.error(chalk.red(e));

      console.log(chalk.yellow('---'));
      console.log(chalk.yellow('Could not estimate gas costs!'));
      console.log(chalk.yellow('---'));

      // TODO: Will need to use `callStatic` on Arbitrum to ensure a tx
      // will go through prior to sending if gas estimations always fail
      // on that network
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
      let populatedTx: PopulatedTransaction | undefined;
      console.log(chalk.blue('6. Populating swap transaction ...'));
      printSpacer();

      // Re-create the params for the swap tx, this time using the dynamically chosen amountOut
      // based on the maximum amount of profit
      const swapExactAmountOutParams: SwapExactAmountOutParams = {
        liquidationPairAddress: liquidationPair.address,
        swapRecipient,
        amountOut: wantedAmountsOut[selectedIndex],
        amountInMax,
        deadline: Math.floor(Date.now() / 1000) + 100,
      };

      populatedTx = await liquidationRouterContract.populateTransaction.swapExactAmountOut(
        ...Object.values(swapExactAmountOutParams),
      );

      const gasLimit = 750000;
      const gasPrice = await provider.getGasPrice();
      const tx = await sendPopulatedTx(
        chainId,
        ozRelayer,
        wallet,
        populatedTx,
        gasLimit,
        gasPrice,
        useFlashbots,
      );

      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

      stats.push({
        pair,
        estimatedProfitUsd,
        txHash: tx.hash,
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
  signer: Signer | DefenderRelaySigner,
  relayerAddress: string,
  context: LiquidatorContext,
) => {
  try {
    printSpacer();
    console.log("Checking 'tokenIn' ERC20 allowance...");

    const tokenInAddress = context.tokenIn.address;
    // @ts-ignore signer as Signer | DefenderRElaySigner should be okay here, ethers just doesn't know about DefenderRelaySigner
    const token = new ethers.Contract(tokenInAddress, ERC20Abi, signer);

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

// Checks to see if the LiquidationPair's tokenOut() is a token we are willing to swap for, avoids
// possibility of manually deployed malicious vaults/pairs
const tokenOutAllowListed = (chainId: number, context: LiquidatorContext) => {
  console.log(
    chalk.dim(
      `Checking if tokenOut '${
        context.tokenOut.symbol
      }' (CA: ${context.tokenOut.address.toLowerCase()}) is in allow list ...`,
    ),
  );

  let tokenOutInAllowList = false;
  try {
    tokenOutInAllowList = LIQUIDATION_TOKEN_ALLOW_LIST[chainId].includes(
      context.tokenOut.address.toLowerCase(),
    );
  } catch (e) {
    console.error(chalk.red(e));
    console.error(
      chalk.white(`Perhaps chain has not been added to LIQUIDATION_TOKEN_ALLOW_LIST ?`),
    );
  }

  if (tokenOutInAllowList) {
    console.log(`tokenOut is in the allow list! 👍`);
  } else {
    console.log(chalk.yellow(`tokenOut is not in the allow list ❌`));
  }

  return tokenOutInAllowList;
};

/**
 * Find and initialize the various contracts we will need for all liquidation pairs
 * @returns {Promise} All of the LiquidationPair contracts, the LiquidationRouter contract
 *                    and the MarketRate contract initialized as ethers contracts
 */
const getLiquidationContracts = async (
  contracts: ContractsBlob,
  config: LiquidatorConfig,
): Promise<{
  liquidationRouterContract: Contract;
  liquidationPairContracts: Contract[];
}> => {
  const { chainId, provider, signer } = config;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  const liquidationPairFactoryContract = getContract(
    'LiquidationPairFactory',
    chainId,
    signer,
    contracts,
    contractsVersion,
  );
  const liquidationPairContracts = await getLiquidationPairsMulticall(
    liquidationPairFactoryContract,
    provider,
  );
  const liquidationRouterContract = getContract(
    'LiquidationRouter',
    chainId,
    signer,
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
  context: LiquidatorContext,
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
  context: LiquidatorContext,
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
  provider: Provider,
): Promise<number> => {
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  printAsterisks();
  console.log(chalk.blue('4. Current gas costs for transaction:'));

  // Estimate gas limit from chain:
  const estimatedGasLimit = await liquidationRouter.estimateGas.swapExactAmountOut(
    ...Object.values(swapExactAmountOutParams),
  );
  printSpacer();
  printSpacer();

  const populatedTx = await liquidationRouter.populateTransaction.swapExactAmountOut(
    ...Object.values(swapExactAmountOutParams),
  );

  const { avgFeeUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    nativeTokenMarketRateUsd,
    provider,
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
  context: LiquidatorContext,
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
        `Max amount out available is 0: (Not enough interest accrued ... Is enough deposited to generate yield?)`,
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
  for (let i = 1; i <= 100; i++) {
    const amountToSendPercent = i;
    // const amountToSendPercent = i * 10; when number of divisions is 10, instead of 100
    const wantedAmountOut = amountOut.mul(ethers.BigNumber.from(amountToSendPercent)).div(100);
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
  provider: Provider,
  liquidationPairContract: Contract,
  context: LiquidatorContext,
  originalMaxAmountOut: BigNumber,
  wantedAmountsOut: BigNumber[],
): Promise<{
  amountIn: BigNumber;
  amountInMax: BigNumber;
  wantedAmountsIn: BigNumber[];
}> => {
  printSpacer();

  let wantedAmountsIn = [];

  const amountIn: BigNumber = await liquidationPairContract.callStatic.computeExactAmountIn(
    originalMaxAmountOut,
  );
  logBigNumber('Amount in:', amountIn, context.tokenIn.decimals, context.tokenIn.symbol);

  const amountInMax = ethers.constants.MaxInt256;

  if (amountIn.eq(0)) {
    return {
      amountIn,
      amountInMax,
      wantedAmountsIn,
    };
  }

  wantedAmountsIn = await getLiquidationPairComputeExactAmountInMulticall(
    liquidationPairContract,
    wantedAmountsOut,
    provider,
  );

  return {
    amountIn,
    amountInMax,
    wantedAmountsIn,
  };
};

const logNextPair = (liquidationPair, liquidationPairContracts) => {
  if (liquidationPair !== liquidationPairContracts[liquidationPairContracts.length - 1]) {
    console.warn(chalk.yellow(`Moving to next pair ...`));
  }
};
