import { ethers, Contract, BigNumber, Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import { FlashLiquidatorConfig, FlashLiquidatorContext } from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  getNativeTokenMarketRateUsd,
  roundTwoDecimalPlaces,
  getFlashLiquidatorContextMulticall,
  getLiquidationPairsMulticall,
  getLiquidationPairComputeExactAmountInMulticall,
  getGasPrice,
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { FlashLiquidatorAbi } from './abis/FlashLiquidatorAbi';
import { LiquidationPairAbi } from './abis/LiquidationPairAbi';
import { FLASH_LIQUIDATION_PAIRS, FLASH_LIQUIDATOR_CONTRACT_ADDRESS } from './constants/flash';
import { NETWORK_NATIVE_TOKEN_INFO } from './constants/network';
import { LIQUIDATION_TOKEN_ALLOW_LIST } from './constants/tokens';
import { sendPopulatedTx } from './helpers/sendPopulatedTx';

interface FlashLiquidateParams {
  liquidationPairAddress: string;
  receiver: string;
  amountOut: BigNumber;
  amountInMax: BigNumber;
  profitMin: BigNumber;
  deadline: number;
  swapPath; // swap path
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
export async function runFlashLiquidator(
  contracts: ContractsBlob,
  config: FlashLiquidatorConfig,
): Promise<void> {
  const {
    chainId,
    ozRelayer,
    wallet,
    signer,
    relayerAddress,
    l1Provider,
    swapRecipient,
    useFlashbots,
    minProfitThresholdUsd,
    covalentApiKey,
  } = config;

  // Get contracts
  //
  printSpacer();
  console.log('Starting ...');

  const flashLiquidationContract = new ethers.Contract(
    FLASH_LIQUIDATOR_CONTRACT_ADDRESS,
    FlashLiquidatorAbi,
    signer,
  );

  // const { liquidationRouterContract, liquidationPairContracts } = await getLiquidationContracts(
  //   contracts,
  //   config,
  // );
  printSpacer();

  // Loop through flash liquidation pairs
  printSpacer();
  console.log(
    chalk.white.bgBlack(` # of Flash Liquidation Pairs: ${FLASH_LIQUIDATION_PAIRS.length} `),
  );

  const stats: Stat[] = [];
  for (let flashLiquidationPair of FLASH_LIQUIDATION_PAIRS) {
    printSpacer();
    printSpacer();
    printSpacer();
    printAsterisks();
    console.log(`Flash LiquidationPair: ${flashLiquidationPair.address}`);

    const liquidationPairContract = new ethers.Contract(
      flashLiquidationPair.address,
      LiquidationPairAbi,
      l1Provider,
    );

    const context: FlashLiquidatorContext = await getFlashLiquidatorContextMulticall(
      liquidationPairContract,
      l1Provider,
      covalentApiKey,
    );
    const pair = `${context.tokenIn.symbol}/${context.tokenOut.symbol}`;

    printContext(context);
    printAsterisks();
    printSpacer();

    // Calculate amounts
    if (!context.underlyingAssetToken.assetRateUsd) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Could not get underlying asset USD value to calculate profit with`,
      });
      // logNextPair(flashLiquidationPair, flashLiquidationPairContracts);
      continue;
    }

    let bestQuote;
    try {
      bestQuote = await flashLiquidationContract.callStatic.findBestQuoteStatic(
        flashLiquidationPair.address,
        flashLiquidationPair.swapPathEncoded,
      );
    } catch (e) {
      console.error('Cannot flash liquidate this pair at this time.');
      // console.error(e.message);
      console.error(chalk.red(e.reason));
    }

    if (!bestQuote.success) {
      console.log(
        chalk.yellow('A flash liquidation on this pair would fail right now, try again soon.'),
      );
      printSpacer();
      continue;
    }

    // Find an estimated amount of gas cost
    const flashLiquidateParams: FlashLiquidateParams = {
      liquidationPairAddress: flashLiquidationPair.address,
      receiver: swapRecipient,
      amountOut: bestQuote.amountOut,
      amountInMax: bestQuote.amountIn.mul(101).div(100), // +1% slippage
      profitMin: bestQuote.profit.mul(99).div(100), // -1% slippage
      deadline: Math.floor(Date.now() / 1000) + 60, // +1 min
      swapPath: flashLiquidationPair.swapPathEncoded,
    };

    let avgFeeUsd = 0;
    try {
      avgFeeUsd = await getGasCost(
        chainId,
        flashLiquidationContract,
        flashLiquidateParams,
        l1Provider,
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
      // logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }
    console.log('avgFeeUsd');
    console.log(avgFeeUsd);

    //   // #6. Decide if profitable or not
    //   const { estimatedProfitUsd, profitable, selectedIndex } = await calculateProfit(
    //     context,
    //     minProfitThresholdUsd,
    //     wantedAmountsIn,
    //     wantedAmountsOut,
    //     avgFeeUsd,
    //   );
    //   if (!profitable) {
    //     console.log(
    //       chalk.red(
    //         `Liquidation Pair ${context.tokenIn.symbol}/${context.tokenOut.symbol}: currently not a profitable trade.`,
    //       ),
    //     );
    //     stats.push({
    //       pair,
    //       estimatedProfitUsd: 0,
    //       error: `Not profitable`,
    //     });
    //     logNextPair(liquidationPair, liquidationPairContracts);
    //     continue;
    //   }

    //   // #7. Finally, populate tx when profitable
    //   try {
    //     let populatedTx: PopulatedTransaction | undefined;
    //     console.log(chalk.blue('6. Populating swap transaction ...'));
    //     printSpacer();

    //     // Re-create the params for the swap tx, this time using the dynamically chosen amountOut
    //     // based on the maximum amount of profit
    //     const swapExactAmountOutParams: SwapExactAmountOutParams = {
    //       liquidationPairAddress: liquidationPair.address,
    //       swapRecipient,
    //       amountOut: wantedAmountsOut[selectedIndex],
    //       amountInMax,
    //       deadline: Math.floor(Date.now() / 1000) + 100,
    //     };

    //     populatedTx = await liquidationRouterContract.populateTransaction.swapExactAmountOut(
    //       ...Object.values(swapExactAmountOutParams),
    //     );

    //     const gasLimit = 850000;
    //     const { gasPrice } = await getGasPrice(l1Provider);
    //     const tx = await sendPopulatedTx(
    //       chainId,
    //       ozRelayer,
    //       wallet,
    //       populatedTx,
    //       gasLimit,
    //       gasPrice,
    //       useFlashbots,
    //     );

    //     console.log(chalk.greenBright.bold('Transaction sent! ✔'));
    //     console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

    //     stats.push({
    //       pair,
    //       estimatedProfitUsd,
    //       txHash: tx.hash,
    //     });
    //   } catch (error) {
    //     stats.push({
    //       pair,
    //       estimatedProfitUsd: 0,
    //       error: error.message,
    //     });
    //     throw new Error(error);
    //   }
    // }

    // printSpacer();
    // printSpacer();
    // printAsterisks();
    // console.log(chalk.greenBright.bold(`SUMMARY`));
    // console.table(stats);
    // const estimatedProfitUsdTotal = stats.reduce((accumulator, stat) => {
    //   return accumulator + stat.estimatedProfitUsd;
    // }, 0);
    // console.log(
    //   chalk.greenBright.bold(`ESTIMATED PROFIT: $${roundTwoDecimalPlaces(estimatedProfitUsdTotal)}`),
    // );
  }
}

// Checks to see if the LiquidationPair's tokenOut() is a token we are willing to swap for, avoids
// possibility of manually deployed malicious vaults/pairs
const tokenOutAllowListed = (chainId: number, context: FlashLiquidatorContext) => {
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
  config: FlashLiquidatorConfig,
): Promise<{
  liquidationRouterContract: Contract;
  liquidationPairContracts: Contract[];
}> => {
  const { chainId, l1Provider, signer } = config;

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
    l1Provider,
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
};

/**
 * Calculates the amount of profit the bot will make on this swap and if it's profitable or not
 * @returns {Promise} Promise boolean of profitability
 */
const calculateProfit = async (
  context: FlashLiquidatorContext,
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
  flashLiquidationContract: Contract,
  flashLiquidateParams: FlashLiquidateParams,
  l1Provider: Provider,
): Promise<number> => {
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  printAsterisks();
  console.log(chalk.blue('4. Current gas costs for transaction:'));

  console.log(...Object.values(flashLiquidateParams));

  // Estimate gas limit from chain:
  const estimatedGasLimit = await flashLiquidationContract.estimateGas.flashLiquidate(
    ...Object.values(flashLiquidateParams),
  );
  printSpacer();
  printSpacer();

  const populatedTx = await flashLiquidationContract.populateTransaction.flashLiquidate(
    ...Object.values(flashLiquidateParams),
  );

  const { avgFeeUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    nativeTokenMarketRateUsd,
    l1Provider,
    populatedTx.data,
  );
  console.log('doubt');
  console.log('avgFeeUsd');
  console.log(avgFeeUsd);

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
  context: FlashLiquidatorContext,
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
  l1Provider: Provider,
  liquidationPairContract: Contract,
  context: FlashLiquidatorContext,
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
    l1Provider,
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
