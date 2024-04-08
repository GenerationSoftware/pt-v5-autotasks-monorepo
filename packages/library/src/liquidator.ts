import { ethers, Contract, BigNumber, Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';
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
} from './utils/index.js';
import { ERC20Abi } from './abis/ERC20Abi.js';
import { NETWORK_NATIVE_TOKEN_INFO, LIQUIDATION_TOKEN_ALLOW_LIST } from './constants/index.js';
import { sendPopulatedTx } from './helpers/sendPopulatedTx.js';

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
    wallet,
    signer,
    relayerAddress,
    swapRecipient,
    minProfitThresholdUsd,
    covalentApiKey,
  } = config;

  console.log(chalk.dim('Config - MIN_PROFIT_THRESHOLD_USD:', config.minProfitThresholdUsd));

  // #1. Get contracts
  //
  printSpacer();
  console.log(chalk.dim('Starting ...'));

  const { liquidationRouterContract, liquidationPairContracts } = await getLiquidationContracts(
    contracts,
    config,
  );

  console.log(chalk.dim('Collecting information about vaults ...'));

  // #2. Loop through all liquidation pairs
  printSpacer();
  console.log(
    chalk.white.bgBlack(` # of Liquidation Pairs (RPC): ${liquidationPairContracts.length} `),
  );
  const stats: Stat[] = [];
  for (let i = 0; i < liquidationPairContracts.length; i++) {
    printSpacer();
    printSpacer();
    printAsterisks();
    const liquidationPair = liquidationPairContracts[i];
    console.log(`LiquidationPair #${i + 1}`);
    console.log(chalk.dim(`LiquidationPair Address: ${liquidationPair.address}`));

    const liquidationPairData = contracts.contracts.find(
      (contract) => contract.type === 'TpdaLiquidationPair',
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

    // #3. Query for amounts
    console.log(chalk.blue(`1. Amounts:`));

    const { amountOut } = await getAmountOut(liquidationPairContract, context);

    if (!context.underlyingAssetToken.assetRateUsd) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Could not get underlying asset USD value to calculate profit with`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    if (amountOut.eq(0)) {
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
        return getAmountIn(liquidationPairContract, context, amountOut);
      } catch (e) {
        console.error(chalk.red(e));

        console.log(chalk.yellow('---'));
        console.log(chalk.yellow('Failed getting amount in!'));
        console.log(chalk.yellow('---'));
      }
    };

    const { amountIn, amountInMax } = await getAmountInValues();

    if (amountIn.eq(0)) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `amountIn is 0`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #4. Print balance of tokenIn for relayer
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

    // #5. Get allowance approval (necessary before upcoming static call)
    //
    await approve(amountIn, liquidationRouterContract, signer, relayerAddress, context);

    // #6. Find an estimated amount that gas will cost
    const swapExactAmountOutParams: SwapExactAmountOutParams = {
      liquidationPairAddress: liquidationPair.address,
      swapRecipient,
      amountOut,
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

      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Could not get gas cost`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #7. Decide if profitable or not
    const { estimatedProfitUsd, profitable } = await calculateProfit(
      context,
      minProfitThresholdUsd,
      amountIn,
      amountOut,
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

    // #8. Finally, populate tx when profitable
    try {
      let populatedTx: PopulatedTransaction | undefined;
      console.log(chalk.blue('6. Populating swap transaction ...'));

      populatedTx = await liquidationRouterContract.populateTransaction.swapExactAmountOut(
        ...Object.values(swapExactAmountOutParams),
      );

      const gasLimit = 750000;
      const gasPrice = await provider.getGasPrice();
      const tx = await sendPopulatedTx(wallet, populatedTx, gasLimit, gasPrice);

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
 * `tokenIn` (likely WETH). We will set allowance to max as we trust the security of the
 * LiquidationRouter contract (you may want to change this!)
 * @returns {undefined} - void function
 */
const approve = async (
  amountIn: BigNumber,
  liquidationRouter: Contract,
  signer: Signer,
  relayerAddress: string,
  context: LiquidatorContext,
) => {
  try {
    printSpacer();
    console.log("Checking 'tokenIn' ERC20 allowance...");

    const tokenInAddress = context.tokenIn.address;
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
    'TpdaLiquidationPairFactory',
    chainId,
    signer,
    contracts,
    contractsVersion,
  );
  const liquidationPairContracts = await getLiquidationPairsMulticall(
    liquidationPairFactoryContract,
    contracts,
    provider,
  );
  const liquidationRouterContract = getContract(
    'TpdaLiquidationRouter',
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
  printSpacer();
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
  amountIn: BigNumber,
  amountOut: BigNumber,
  avgFeeUsd: number,
): Promise<{ estimatedProfitUsd: number; profitable: boolean }> => {
  printAsterisks();
  console.log(chalk.blue('5. Profit/Loss (USD):'));
  printSpacer();

  console.log(chalk.blueBright('Gross profit = tokenOut - tokenIn'));
  const underlyingAssetTokenUsd =
    parseFloat(ethers.utils.formatUnits(amountOut, context.tokenOut.decimals)) *
    context.underlyingAssetToken.assetRateUsd;
  const tokenInUsd =
    parseFloat(ethers.utils.formatUnits(amountIn, context.tokenIn.decimals)) *
    context.tokenIn.assetRateUsd;

  const grossProfitUsd = underlyingAssetTokenUsd - tokenInUsd;

  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(grossProfitUsd)} = $${roundTwoDecimalPlaces(
        underlyingAssetTokenUsd,
      )} - $${roundTwoDecimalPlaces(tokenInUsd)}`,
    ),
  );
  printSpacer();

  const netProfitUsd = grossProfitUsd - avgFeeUsd;
  console.log(chalk.magenta('Net profit = Gross profit - Gas fee (Average)'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = $${roundTwoDecimalPlaces(
        grossProfitUsd,
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

  return { estimatedProfitUsd, profitable };
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
  printSpacer();

  // Estimate gas limit from chain:
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
    provider,
    populatedTx.data,
  );

  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${nativeTokenMarketRateUsd}`,
  );

  logBigNumber(
    'Estimated gas limit (wei):',
    estimatedGasLimit,
    18,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );
  printSpacer();

  logTable({ avgFeeUsd });

  return avgFeeUsd;
};

/**
 * Queries for available yield that can be liquidated based on current state of the contracts
 * @returns {Promise} Promise object with the input parameters exactAmountIn and amountOutMin
 */
const getAmountOut = async (
  liquidationPair: Contract,
  context: LiquidatorContext,
): Promise<{
  amountOut: BigNumber;
}> => {
  printSpacer();

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
  }

  return {
    amountOut,
  };
};

/**
 * Calculates necessary input parameters for the swap call based on current state of the contracts
 * @returns {Promise} Promise object with the input parameters exactAmountIn and amountOutMin
 */
const getAmountIn = async (
  liquidationPairContract: Contract,
  context: LiquidatorContext,
  amountOut: BigNumber,
): Promise<{
  amountIn: BigNumber;
  amountInMax: BigNumber;
}> => {
  const amountIn: BigNumber = await liquidationPairContract.callStatic.computeExactAmountIn(
    amountOut,
  );
  logBigNumber('Amount in:', amountIn, context.tokenIn.decimals, context.tokenIn.symbol);

  const amountInMax = ethers.constants.MaxInt256;

  return {
    amountIn,
    amountInMax,
  };
};

const logNextPair = (liquidationPair, liquidationPairContracts) => {
  if (liquidationPair !== liquidationPairContracts[liquidationPairContracts.length - 1]) {
    console.warn(chalk.yellow(`Moving to next pair ...`));
  }
};
