import { ethers, Contract, BigNumber } from 'ethers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { getContract } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import { ContractsBlob, Token, DrawReserveConfigParams, DrawReserveContext } from './types';
import {
  logTable,
  logBigNumber,
  logStringValue,
  printAsterisks,
  printSpacer,
  parseBigNumberAsFloat,
  MARKET_RATE_CONTRACT_DECIMALS,
  getFeesUsd,
  getGasTokenMarketRateUsd,
  roundTwoDecimalPlaces,
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';

interface DrawReserveParams {
  amount: BigNumber;
  reserveRecipient: string;
}

/**
 * Only withdraw reserve if we're going to make at least X dollars
 */
const MIN_PROFIT_THRESHOLD_USD = 1;

/**
 * Creates a populated transaction object for a draw start & complete bot to withdraw their reserve.
 *
 * @returns {(Promise|undefined)} Promise of an ethers PopulatedTransaction or undefined
 */
export async function getWithdrawReserveTx(
  contracts: ContractsBlob,
  readProvider: Provider,
  params: DrawReserveConfigParams,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, reserveRecipient, relayerAddress } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePool = getContract('PrizePool', chainId, readProvider, contracts, contractsVersion);
  const marketRate = getContract('MarketRate', chainId, readProvider, contracts, contractsVersion);

  if (!prizePool) {
    throw new Error('DrawReserve: PrizePool Contract Unavailable');
  }

  // #1. Get context about the prize pool prize token, etc
  const context: DrawReserveContext = await getContext(prizePool, marketRate, readProvider);
  printContext(context);

  // #2. Get data about how much reserve a prize claimer can withdraw
  printSpacer();
  console.log(chalk.blue(`2. Getting reserve balance for '${relayerAddress}' ...`));
  // const amount = await prizePool.???(relayerAddress);
  const amount = BigNumber.from(1);

  logBigNumber(
    `${context.reserveToken.symbol} balance:`,
    amount,
    context.reserveToken.decimals,
    context.reserveToken.symbol,
  );
  const reserveTokenUsd =
    parseFloat(ethers.utils.formatUnits(amount, context.reserveToken.decimals)) *
    context.reserveToken.assetRateUsd;
  console.log(
    chalk.dim(`${context.reserveToken.symbol} balance (USD):`),
    chalk.greenBright(`$${roundTwoDecimalPlaces(reserveTokenUsd)}`),
  );

  let populatedTx: PopulatedTransaction;

  const drawReserveParams: DrawReserveParams = {
    reserveRecipient,
    amount,
  };

  // #3. Decide if profitable or not
  const profitable = await calculateProfit(
    chainId,
    contracts,
    marketRate,
    prizePool,
    reserveTokenUsd,
    drawReserveParams,
    readProvider,
  );
  if (!profitable) {
    printAsterisks();
    console.log(chalk.yellow(`Not profitable to withdraw reserve yet. Exiting ...`));
  } else {
    printAsterisks();
    console.log(chalk.blue(`5. Creating transaction ...`));

    console.log(chalk.green('DrawReserve: Add Populated Claim Tx'));
    populatedTx = await prizePool.populateTransaction.withdrawReserve(
      ...Object.values(drawReserveParams),
    );
  }

  return populatedTx;
}

/**
 * Gather information about the given prize pool's fee token, fee token price in USD
 * and the last drawId
 * @returns {Promise} Promise of a DrawReserveContext object
 */
const getContext = async (
  prizePool: Contract,
  marketRate: Contract,
  readProvider: Provider,
): Promise<DrawReserveContext> => {
  const reserveTokenAddress = await prizePool.prizeToken();

  const tokenInContract = new ethers.Contract(reserveTokenAddress, ERC20Abi, readProvider);

  const reserveToken: Token = {
    address: reserveTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol(),
  };

  const reserveTokenWithRate = {
    ...reserveToken,
    assetRateUsd: await getReserveTokenRateUsd(marketRate, reserveToken),
  };

  return { reserveToken: reserveTokenWithRate };
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = (context) => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Reserve token: ${context.reserveToken.symbol}`));
  printSpacer();

  logTable({ reserveToken: context.reserveToken });
  logStringValue(
    `Reserve token '${context.reserveToken.symbol}' MarketRate USD:`,
    `$${context.reserveToken.assetRateUsd}`,
  );
};

/**
 * Finds the spot price of the reserve token in USD
 * @returns {number} reserveTokenRateUsd
 */
const getReserveTokenRateUsd = async (
  marketRate: Contract,
  reserveToken: Token,
): Promise<number> => {
  const reserveTokenAddress = reserveToken.address;
  const reserveTokenRate = await marketRate.priceFeed(reserveTokenAddress, 'USD');

  return parseBigNumberAsFloat(reserveTokenRate, MARKET_RATE_CONTRACT_DECIMALS);
};

/**
 * Calculates the amount of profit the bot will make on this swap and if it's profitable or not
 * @returns {Promise} Promise boolean of profitability
 */
const calculateProfit = async (
  chainId: number,
  contracts: ContractsBlob,
  marketRate: Contract,
  prizePool: Contract,
  reserveTokenUsd: number,
  drawReserveParams: DrawReserveParams,
  readProvider: Provider,
): Promise<Boolean> => {
  const gasTokenMarketRateUsd = await getGasTokenMarketRateUsd(contracts, marketRate);

  printAsterisks();
  console.log(chalk.blue('3. Current gas costs for transaction:'));

  let estimatedGasLimit;
  try {
    estimatedGasLimit = await prizePool.estimateGas.withdrawReserve(
      ...Object.values(drawReserveParams),
    );
  } catch (e) {
    console.error(chalk.red(e));
  }
  const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    gasTokenMarketRateUsd,
    readProvider,
  );
  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    gasTokenMarketRateUsd,
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
  console.log(chalk.blue('4. Profit/Loss (USD):'));
  printSpacer();

  const grossProfitUsd = reserveTokenUsd;
  const netProfitUsd = grossProfitUsd - maxFeeUsd;

  console.log(chalk.magenta('Gross profit = tokenOut - tokenIn'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(grossProfitUsd)} = $${roundTwoDecimalPlaces(reserveTokenUsd)}`,
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

  const profitable = netProfitUsd > MIN_PROFIT_THRESHOLD_USD;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${MIN_PROFIT_THRESHOLD_USD}`,
    'Net profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    'Profitable?': profitable ? '✔' : '✗',
  });
  printSpacer();

  return profitable;
};
