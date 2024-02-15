import { ethers, Contract, BigNumber, Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';
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
  getGasPrice,
} from './utils';
import { FlashLiquidatorAbi } from './abis/FlashLiquidatorAbi';
import { LiquidationPairAbi } from './abis/LiquidationPairAbi';
import { FLASH_LIQUIDATION_PAIRS, FLASH_LIQUIDATOR_CONTRACT_ADDRESS } from './constants/flash';
import { NETWORK_NATIVE_TOKEN_INFO } from './constants/network';
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
export async function runFlashLiquidator(config: FlashLiquidatorConfig): Promise<void> {
  const {
    chainId,
    ozRelayer,
    wallet,
    signer,
    provider,
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
      provider,
    );

    const context: FlashLiquidatorContext = await getFlashLiquidatorContextMulticall(
      liquidationPairContract,
      provider,
      covalentApiKey,
    );
    const pair = `${context.tokenIn.symbol}/${context.tokenOut.symbol}`;

    printContext(context);
    printSpacer();

    if (!context.underlyingAssetToken.assetRateUsd) {
      console.log(
        chalk.yellow(`Could not get underlying asset USD value to calculate profit with`),
      );
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Could not get underlying asset USD value to calculate profit with`,
      });
      continue;
    }

    // Get profit quote
    let bestQuote;
    try {
      bestQuote = await flashLiquidationContract.callStatic.findBestQuoteStatic(
        flashLiquidationPair.address,
        flashLiquidationPair.swapPathEncoded,
      );
    } catch (e) {
      console.error(e);
      console.error('Cannot flash liquidate this pair at this time.');
      console.error(chalk.red(e.reason));
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Error querying findBestQuoteStatic, Cannot flash liquidate this pair at this time`,
      });
      continue;
    }

    if (!!bestQuote && !bestQuote.success) {
      console.log(
        chalk.yellow('A flash liquidation on this pair would fail right now, try again soon.'),
      );
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Would fail right now`,
      });

      printSpacer();
      continue;
    }

    // Find an estimated amount of gas cost
    const flashLiquidateParams: FlashLiquidateParams = {
      liquidationPairAddress: flashLiquidationPair.address,
      receiver: swapRecipient,
      amountOut: bestQuote.amountOut,
      amountInMax: bestQuote.amountIn.mul(101).div(100), // +1% slippage
      profitMin: bestQuote.profit.mul(98).div(100), // -2% slippage
      deadline: Math.floor(Date.now() / 1000) + 60, // +1 min
      swapPath: flashLiquidationPair.swapPathEncoded,
    };

    let avgFeeUsd = 0;
    try {
      avgFeeUsd = await getGasCost(
        chainId,
        flashLiquidationContract,
        flashLiquidateParams,
        provider,
      );
    } catch (e) {
      console.error(chalk.red(e));
      console.log(chalk.yellow('Could not estimate gas costs!'));

      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Could not get gas cost`,
      });
      continue;
    }

    // Decide if profitable or not
    const { estimatedProfitUsd, profitable } = await calculateProfit(
      context,
      bestQuote.profit,
      minProfitThresholdUsd,
      avgFeeUsd,
    );
    if (!profitable) {
      const msg = `Liquidation Pair ${context.tokenIn.symbol}/${context.tokenOut.symbol}: currently not a profitable trade.`;
      console.log(chalk.red(msg));
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: msg,
      });
      continue;
    }

    // Send tx when profitable
    try {
      let populatedTx: PopulatedTransaction | undefined;
      console.log(chalk.blue('6. Populating swap transaction ...'));
      printSpacer();

      populatedTx = await flashLiquidationContract.populateTransaction.flashLiquidate(
        ...Object.values(flashLiquidateParams),
      );

      const gasLimit = 1050000;
      const { gasPrice } = await getGasPrice(provider);
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
  bestQuoteProfit: BigNumber,
  minProfitThresholdUsd: number,
  avgFeeUsd: number,
): Promise<{ estimatedProfitUsd: number; profitable: boolean }> => {
  printAsterisks();
  console.log(chalk.blue('5. Profit/Loss (USD):'));
  printSpacer();

  console.log(chalk.blueBright('Gross profit = tokenOut - tokenIn'));
  printSpacer();

  // formatEther (18 units) as profit is always in POOL for flash liquidations
  const maxGrossProfit =
    parseFloat(ethers.utils.formatEther(bestQuoteProfit)) * context.tokenIn.assetRateUsd;

  console.log(chalk.blueBright(`$${roundTwoDecimalPlaces(maxGrossProfit)}`));
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

  return { estimatedProfitUsd, profitable };
};

/**
 * Get the gas cost for the tx
 * @returns {Promise} Promise with the maximum gas fee in USD
 */
const getGasCost = async (
  chainId: number,
  flashLiquidationContract: Contract,
  flashLiquidateParams: FlashLiquidateParams,
  provider: Provider,
): Promise<number> => {
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  printAsterisks();
  console.log(chalk.blue('4. Current gas costs for transaction:'));

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
