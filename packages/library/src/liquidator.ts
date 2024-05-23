import { ethers, Contract, BigNumber, Signer } from 'ethers';
import { Provider, TransactionResponse } from '@ethersproject/providers';
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
  checkOrX,
} from './utils/index.js';
import { ERC20Abi } from './abis/ERC20Abi.js';
import { UniswapV2WethPairFlashLiquidatorAbi } from './abis/UniswapV2WethPairFlashLiquidatorAbi.js';
import {
  UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS,
  NETWORK_NATIVE_TOKEN_INFO,
} from './constants/index.js';
import { sendPopulatedTx } from './helpers/sendPopulatedTx.js';

interface SwapExactAmountOutParams {
  liquidationPairAddress: string;
  swapRecipient: string;
  amountOut: BigNumber;
  amountInMax: BigNumber;
  deadline: number;
}

interface FlashSwapExactAmountOutParams {
  pair: string;
  receiver: string;
  swapAmountOut: BigNumber;
  minProfit: BigNumber;
}

interface Stat {
  pair: string;
  estimatedProfitUsd: number;
  txHash?: string;
  error?: string;
}

const stats: Stat[] = [];

const getPairName = (context: LiquidatorContext) => {
  return `${context.tokenIn.symbol}/${context.tokenOut.symbol}`;
};

const logAllowList = (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
) => {
  const pair = getPairName(context);
  const error = `tokenOut '${
    context.tokenOut.symbol
  }' (CA: ${context.tokenOut.address.toLowerCase()}) not in token allow list`;
  console.log(chalk.yellow(error));

  stats.push({
    pair,
    estimatedProfitUsd: 0,
    error,
  });
  logNextPair(liquidationPairContract, liquidationPairContracts);
};

const logAmountInEqZero = (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
) => {
  const pair = getPairName(context);
  const error = `amountIn is 0`;
  console.log(chalk.yellow(error));
  stats.push({
    pair,
    estimatedProfitUsd: 0,
    error,
  });
  logNextPair(liquidationPairContract, liquidationPairContracts);
};

const logAmountOutEqZero = (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
) => {
  const pair = getPairName(context);
  const error = `amountOut is 0`;
  console.log(chalk.yellow(error));

  stats.push({
    pair,
    estimatedProfitUsd: 0,
    error,
  });
  logNextPair(liquidationPairContract, liquidationPairContracts);
};

const logNoTokenOutAssetValue = (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
) => {
  const pair = getPairName(context);
  const error = `Could not get tokenOut asset value (in $USD) to calculate profit with.`;

  console.log(chalk.yellow(error));

  stats.push({
    pair,
    estimatedProfitUsd: 0,
    error,
  });
  logNextPair(liquidationPairContract, liquidationPairContracts);
};

const logInsufficientRelayerBalance = (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
  increaseAmount: string,
  relayerAddress: string,
) => {
  const pair = getPairName(context);
  const error = `Relayer ${context.tokenIn.symbol} balance insufficient by ${roundTwoDecimalPlaces(
    Number(increaseAmount),
  )}`;
  console.log(
    chalk.red(
      `Increase relayer '${relayerAddress}' ${context.tokenIn.symbol} balance by ${increaseAmount}`,
    ),
  );

  stats.push({
    pair,
    estimatedProfitUsd: 0,
    error,
  });
  logNextPair(liquidationPairContract, liquidationPairContracts);
};

const logNoFlashSwapWeth = (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
) => {
  const pair = getPairName(context);
  const error = `Flash swap unavailable at this time.`;
  console.log(chalk.yellow(error));

  stats.push({
    pair,
    estimatedProfitUsd: 0,
    error,
  });
  logNextPair(liquidationPairContract, liquidationPairContracts);
};

const logNoEstimateGasCost = (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
) => {
  const pair = getPairName(context);
  const error = `Could not estimate gas cost`;
  console.log(chalk.yellow(error));

  stats.push({
    pair,
    estimatedProfitUsd: 0,
    error,
  });
  logNextPair(liquidationPairContract, liquidationPairContracts);
};

const logNotProfitableTrade = (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
) => {
  const pair = getPairName(context);
  const error = `Liquidation Pair ${context.tokenIn.symbol}/${context.tokenOut.symbol}: currently not a profitable trade.`;
  console.log(chalk.yellow(error));

  stats.push({
    pair,
    estimatedProfitUsd: 0,
    error,
  });
  logNextPair(liquidationPairContract, liquidationPairContracts);
};

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
  const { provider, relayerAddress, covalentApiKey } = config;
  printSpacer();

  // TODO: REFACTOR - We see this in every bot:
  //     WOULD BE IDEAL TO HAVE THIS IN THE CONFIG! Move it one (or two) level(s) higher
  let swapRecipient = config.swapRecipient;
  if (!swapRecipient) {
    const message = `Config - SWAP_RECIPIENT not provided, setting swap recipient to relayer address:`;
    console.log(chalk.dim(message), chalk.yellow(relayerAddress));
    swapRecipient = relayerAddress;
  } else {
    console.log(chalk.dim(`Config - SWAP_RECIPIENT:`), chalk.yellow(swapRecipient));
  }

  console.log(
    chalk.dim('Config - MIN_PROFIT_THRESHOLD_USD:'),
    chalk.yellow(config.minProfitThresholdUsd),
  );
  // END TODO: REFACTOR

  // 1. Get contracts
  printSpacer();
  console.log(chalk.dim('Starting ...'));

  const {
    uniswapV2WethPairFlashLiquidatorContract,
    liquidationRouterContract,
    liquidationPairContracts,
  } = await getLiquidationContracts(contracts, config);

  console.log(chalk.dim('Collecting information about vaults ...'));

  // 2. Loop through all liquidation pairs
  printSpacer();
  console.log(
    chalk.white.bgBlack(` # of Liquidation Pairs (RPC): ${liquidationPairContracts.length} `),
  );
  for (let i = 0; i < liquidationPairContracts.length; i++) {
    printSpacer();
    printSpacer();
    printAsterisks();
    printSpacer();
    const liquidationPairContract = liquidationPairContracts[i];
    console.log(`LiquidationPair #${i + 1}`);
    printSpacer();
    console.log(chalk.blue(`Pair Address: ${liquidationPairContract.address}`));

    const context: LiquidatorContext = await getLiquidatorContextMulticall(
      config,
      liquidationRouterContract,
      liquidationPairContract,
      provider,
      relayerAddress,
      covalentApiKey,
    );

    printContext(config, context);
    printSpacer();

    const tokenOutInAllowList = context.tokenOutInAllowList;
    if (!tokenOutInAllowList) {
      logAllowList(context, liquidationPairContract, liquidationPairContracts);
      continue;
    }

    console.log(`tokenOut is in the allow list! 👍`);
    printSpacer();
    printSpacer();

    // 3. Query for amounts
    console.log(chalk.blue(`1. Amounts:`));
    const { amountOut } = await getAmountOut(liquidationPairContract, context);

    if (amountOut.eq(0)) {
      logAmountOutEqZero(context, liquidationPairContract, liquidationPairContracts);
      continue;
    }

    // 4. Continue for each type to see if a transaction should be sent
    if (context.isValidWethFlashLiquidationPair) {
      await processUniV2WethLPPair(
        config,
        context,
        uniswapV2WethPairFlashLiquidatorContract,
        liquidationPairContract,
        liquidationPairContracts,
        amountOut,
        swapRecipient,
      );
    } else {
      await processSingleTokenPair(
        config,
        context,
        liquidationRouterContract,
        liquidationPairContract,
        liquidationPairContracts,
        amountOut,
        swapRecipient,
      );
    }
  }

  // 5. Run Summary of all trades and potential trades
  printSpacer();
  printSpacer();
  console.log(chalk.greenBright.bold(`SUMMARY`));
  console.table(stats);
  const estimatedProfitUsdTotal = stats.reduce((accumulator, stat) => {
    return accumulator + stat.estimatedProfitUsd;
  }, 0);
  console.log(
    chalk.greenBright.bold(`ESTIMATED PROFIT: $${roundTwoDecimalPlaces(estimatedProfitUsdTotal)}`),
  );
  printSpacer();
}

const processUniV2WethLPPair = async (
  config: LiquidatorConfig,
  context: LiquidatorContext,
  uniswapV2WethPairFlashLiquidatorContract: Contract,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
  amountOut: BigNumber,
  swapRecipient: string,
) => {
  const { chainId, provider, minProfitThresholdUsd } = config;

  const pair = getPairName(context);

  // Process if this an LP pair (with WETH on one side) we can
  // liquidate via 'ETH' (or other native gas token) as input
  let wethFromFlashSwap = BigNumber.from(0);

  try {
    wethFromFlashSwap =
      await uniswapV2WethPairFlashLiquidatorContract.callStatic.flashSwapExactAmountOut(
        liquidationPairContract.address,
        config.relayerAddress,
        amountOut,
        BigNumber.from(0),
      );

    logBigNumber(
      `WETH received from flash swap:`,
      wethFromFlashSwap,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
    );
  } catch (e) {
    logNoFlashSwapWeth(context, liquidationPairContract, liquidationPairContracts);
    return;
  }

  // Find an estimated amount that gas will cost, and use wethFromFlashSwap as minProfit we're expecting
  const flashSwapExactAmountOutParams: FlashSwapExactAmountOutParams = {
    pair: liquidationPairContract.address,
    receiver: swapRecipient,
    swapAmountOut: amountOut,
    minProfit: wethFromFlashSwap,
  };

  let avgFeeUsd = 0;
  try {
    avgFeeUsd = await getUniV2WethFlashSwapGasCost(
      chainId,
      uniswapV2WethPairFlashLiquidatorContract,
      flashSwapExactAmountOutParams,
      provider,
    );
  } catch (e) {
    console.error(chalk.red(e));
    logNoEstimateGasCost(context, liquidationPairContract, liquidationPairContracts);
    return;
  }

  if (avgFeeUsd <= 0) {
    return;
  }

  // Decide if profitable or not
  const { estimatedProfitUsd, profitable } = await calculateUniV2WethFlashSwapProfit(
    config,
    minProfitThresholdUsd,
    wethFromFlashSwap,
    avgFeeUsd,
  );
  if (!profitable) {
    logNotProfitableTrade(context, liquidationPairContract, liquidationPairContracts);
    return;
  }

  // Populate tx when profitable
  try {
    const tx = await sendPopulatedUniV2WethFlashSwapTransaction(
      config,
      provider,
      uniswapV2WethPairFlashLiquidatorContract,
      flashSwapExactAmountOutParams,
    );
    stats.push({
      pair,
      estimatedProfitUsd,
      txHash: tx.hash,
    });
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(3000); // sleep due to nonce re-use issues (ie. too many tx's sent at once)
  } catch (error) {
    stats.push({
      pair,
      estimatedProfitUsd: 0,
      error: error.message,
    });
    throw new Error(error);
  }
};

const calculateAmountIn = async (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  amountOut: BigNumber,
): Promise<{ amountIn: BigNumber; amountInMax: BigNumber }> => {
  const getAmountInValues = async () => {
    try {
      return getAmountIn(liquidationPairContract, context, amountOut);
    } catch (e) {
      console.error(chalk.red(e));
      console.log(chalk.yellow('Failed getting amount in!'));
    }
  };
  const { amountIn, amountInMax } = await getAmountInValues();

  return { amountIn, amountInMax };
};

// Get balance of tokenIn for relayer
const isBalanceSufficient = async (
  context: LiquidatorContext,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
  amountIn: BigNumber,
  relayerAddress: string,
): Promise<boolean> => {
  const sufficientBalance = await checkBalance(context, amountIn);

  if (sufficientBalance) {
    console.log(chalk.green('Sufficient balance ✔'));
  } else {
    console.log(chalk.red('Insufficient balance ✗'));

    const diff = amountIn.sub(context.relayer.tokenInBalance);
    const increaseAmount = ethers.utils.formatUnits(diff, context.tokenIn.decimals);

    logInsufficientRelayerBalance(
      context,
      liquidationPairContract,
      liquidationPairContracts,
      increaseAmount,
      relayerAddress,
    );
  }

  return sufficientBalance;
};

// Process a regular PT LiquidityPair
const processSingleTokenPair = async (
  config: LiquidatorConfig,
  context: LiquidatorContext,
  liquidationRouterContract: Contract,
  liquidationPairContract: Contract,
  liquidationPairContracts: Contract[],
  amountOut: BigNumber,
  swapRecipient: string,
) => {
  const { provider, signer, minProfitThresholdUsd, relayerAddress } = config;

  const pair = getPairName(context);

  const assetRateUsd = context.underlyingAssetToken.assetRateUsd;

  if (!assetRateUsd) {
    logNoTokenOutAssetValue(context, liquidationPairContract, liquidationPairContracts);
    return;
  }

  const { amountIn, amountInMax } = await calculateAmountIn(
    context,
    liquidationPairContract,
    amountOut,
  );
  if (amountIn.eq(0)) {
    logAmountInEqZero(context, liquidationPairContract, liquidationPairContracts);
    return;
  }

  const sufficientBalance = await isBalanceSufficient(
    context,
    liquidationPairContract,
    liquidationPairContracts,
    amountIn,
    relayerAddress,
  );
  if (!sufficientBalance) {
    return;
  }

  // Get allowance approval (necessary before upcoming static call)
  await approve(amountIn, liquidationRouterContract, signer, relayerAddress, context);

  // Find an estimated amount that gas will cost
  const swapExactAmountOutParams: SwapExactAmountOutParams = {
    liquidationPairAddress: liquidationPairContract.address,
    swapRecipient,
    amountOut,
    amountInMax,
    deadline: Math.floor(Date.now() / 1000) + 100,
  };

  let avgFeeUsd = 0;
  try {
    avgFeeUsd = await getLiquidationRouterSwapExactAmountOutGasCost(
      config,
      liquidationRouterContract,
      swapExactAmountOutParams,
    );
  } catch (e) {
    console.error(chalk.red(e));
    logNoEstimateGasCost(context, liquidationPairContract, liquidationPairContracts);
    return;
  }
  if (avgFeeUsd <= 0) {
    return;
  }

  // Decide if profitable or not
  const { estimatedProfitUsd, profitable } = await calculateSwapExactAmountOutProfit(
    context,
    minProfitThresholdUsd,
    amountIn,
    amountOut,
    avgFeeUsd,
  );

  if (!profitable) {
    logNotProfitableTrade(context, liquidationPairContract, liquidationPairContracts);
    return;
  }

  // Populate tx when profitable
  try {
    const tx = await sendPopulatedSwapExactAmountOutTransaction(
      config,
      provider,
      liquidationRouterContract,
      swapExactAmountOutParams,
    );

    stats.push({
      pair,
      estimatedProfitUsd,
      txHash: tx.hash,
    });

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(3000); // sleep due to nonce re-use issues (ie. too many tx's sent at once)
  } catch (error) {
    stats.push({
      pair,
      estimatedProfitUsd: 0,
      error: error.message,
    });
    throw new Error(error);
  }
};

const sendPopulatedSwapExactAmountOutTransaction = async (
  config: LiquidatorConfig,
  provider: Provider,
  liquidationRouterContract: Contract,
  swapExactAmountOutParams: SwapExactAmountOutParams,
): Promise<TransactionResponse> => {
  let populatedTx: PopulatedTransaction | undefined;
  console.log(chalk.blue('5. Populating swap transaction ...'));

  populatedTx = await liquidationRouterContract.populateTransaction.swapExactAmountOut(
    ...Object.values(swapExactAmountOutParams),
  );

  const gasLimit = 750000;
  const gasPrice = await provider.getGasPrice();
  const tx = await sendPopulatedTx(config.wallet, populatedTx, gasLimit, gasPrice);

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

  return tx;
};

const sendPopulatedUniV2WethFlashSwapTransaction = async (
  config: LiquidatorConfig,
  provider: Provider,
  uniswapV2WethPairFlashLiquidatorContract: Contract,
  flashSwapExactAmountOutParams: FlashSwapExactAmountOutParams,
): Promise<TransactionResponse> => {
  let populatedTx: PopulatedTransaction | undefined;
  console.log(chalk.blue('6. Populating swap transaction ...'));

  // Estimate gas limit from chain:
  const estimatedGasLimit =
    await uniswapV2WethPairFlashLiquidatorContract.estimateGas.flashSwapExactAmountOut(
      ...Object.values(flashSwapExactAmountOutParams),
    );

  populatedTx =
    await uniswapV2WethPairFlashLiquidatorContract.populateTransaction.flashSwapExactAmountOut(
      ...Object.values(flashSwapExactAmountOutParams),
    );

  const gasPrice = await provider.getGasPrice();
  const tx = await sendPopulatedTx(config.wallet, populatedTx, Number(estimatedGasLimit), gasPrice);

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

  return tx;
};

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

/**
 * Find and initialize the various contracts we will need for all liquidation pairs
 * @returns {Promise} All of the LiquidationPair contracts, the LiquidationRouter contract
 *                    and the MarketRate contract initialized as ethers contracts
 */
const getLiquidationContracts = async (
  contracts: ContractsBlob,
  config: LiquidatorConfig,
): Promise<{
  uniswapV2WethPairFlashLiquidatorContract: Contract;
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

  let uniswapV2WethPairFlashLiquidatorContract;
  if (UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS[config.chainId]) {
    uniswapV2WethPairFlashLiquidatorContract = new ethers.Contract(
      UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS[config.chainId],
      UniswapV2WethPairFlashLiquidatorAbi,
      signer,
    );
  }

  return {
    uniswapV2WethPairFlashLiquidatorContract,
    liquidationRouterContract,
    liquidationPairContracts,
  };
};

const printContext = (config: LiquidatorConfig, context: LiquidatorContext) => {
  console.log(chalk.blue(`Pair Symbol:  ${context.tokenIn.symbol}/${context.tokenOut.symbol}`));
  printSpacer();

  logTable({
    tokenIn: context.tokenIn,
    tokenOut: context.tokenOut,
    underlyingAssetToken: context.underlyingAssetToken,
  });
  printSpacer();

  if (context.isValidWethFlashLiquidationPair) {
    logStringValue('Underlying asset is UniV2 WETH LP pair?', checkOrX(true));
    printSpacer();
  }

  logBigNumber(
    `Relayer ${NETWORK_NATIVE_TOKEN_INFO[config.chainId].symbol} balance:`,
    context.relayer.nativeTokenBalance,
    NETWORK_NATIVE_TOKEN_INFO[config.chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[config.chainId].symbol,
  );
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
  printSpacer();
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
const calculateSwapExactAmountOutProfit = async (
  context: LiquidatorContext,
  minProfitThresholdUsd: number,
  amountIn: BigNumber,
  amountOut: BigNumber,
  avgFeeUsd: number,
): Promise<{ estimatedProfitUsd: number; profitable: boolean }> => {
  printSpacer();
  console.log(chalk.blue('4. Profit/Loss (USD):'));
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
 * Calculates the amount of profit the bot will make on this swap and if it's profitable or not
 * @returns {Promise} Promise boolean of profitability
 */
const calculateUniV2WethFlashSwapProfit = async (
  config: LiquidatorConfig,
  minProfitThresholdUsd: number,
  wethFromFlashSwap: BigNumber,
  avgFeeUsd: number,
): Promise<{ estimatedProfitUsd: number; profitable: boolean }> => {
  printSpacer();
  console.log(chalk.blue('3. Profit/Loss (USD):'));
  printSpacer();

  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(config.chainId);
  const wethOutUsd =
    parseFloat(
      ethers.utils.formatUnits(
        wethFromFlashSwap,
        NETWORK_NATIVE_TOKEN_INFO[config.chainId].decimals,
      ),
    ) * nativeTokenMarketRateUsd;

  const netProfitUsd = wethOutUsd - avgFeeUsd;
  console.log(chalk.magenta('Net profit = Gross profit WETH Out (in $USD) - Gas fee (Average)'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = $${roundTwoDecimalPlaces(
        wethOutUsd,
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
const getLiquidationRouterSwapExactAmountOutGasCost = async (
  config: LiquidatorConfig,
  liquidationRouter: Contract,
  swapExactAmountOutParams: SwapExactAmountOutParams,
): Promise<number> => {
  const { chainId, provider } = config;

  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  printSpacer();
  console.log(chalk.blue('3. Current gas costs for transaction:'));
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
 * Get the gas cost for the tx
 * @returns {Promise} Promise with the maximum gas fee in USD
 */
const getUniV2WethFlashSwapGasCost = async (
  chainId: number,
  uniswapV2WethPairFlashLiquidatorContract: Contract,
  flashSwapExactAmountOutParams: FlashSwapExactAmountOutParams,
  provider: Provider,
): Promise<number> => {
  printSpacer();
  console.log(chalk.blue('2. Current gas costs for transaction:'));
  printSpacer();

  // Estimate gas limit from chain:
  const estimatedGasLimit =
    await uniswapV2WethPairFlashLiquidatorContract.estimateGas.flashSwapExactAmountOut(
      ...Object.values(flashSwapExactAmountOutParams),
    );

  const populatedTx =
    await uniswapV2WethPairFlashLiquidatorContract.populateTransaction.flashSwapExactAmountOut(
      ...Object.values(flashSwapExactAmountOutParams),
    );

  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);
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
