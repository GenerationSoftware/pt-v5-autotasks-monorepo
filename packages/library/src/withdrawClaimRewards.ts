import { ethers, Contract, BigNumber } from 'ethers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import { Token, WithdrawClaimRewardsConfigParams, WithdrawClaimRewardsContext } from './types';
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

interface WithdrawClaimRewardsParams {
  amount: BigNumber;
  rewardsRecipient: string;
}

/**
 * Creates a populated transaction object for a prize claimer to withdraw their claim rewards.
 *
 * @returns {(Promise|undefined)} Promise of an ethers PopulatedTransaction or undefined
 */
export async function getWithdrawClaimRewardsTx(
  contracts: ContractsBlob,
  readProvider: Provider,
  params: WithdrawClaimRewardsConfigParams,
): Promise<PopulatedTransaction | undefined> {
  const { chainId, rewardsRecipient, relayerAddress, minProfitThresholdUsd } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePool = getContract('PrizePool', chainId, readProvider, contracts, contractsVersion);
  const marketRate = getContract('MarketRate', chainId, readProvider, contracts, contractsVersion);

  if (!prizePool) {
    throw new Error('WithdrawRewards: PrizePool Contract Unavailable');
  }

  // #1. Get context about the prize pool prize token, etc
  const context: WithdrawClaimRewardsContext = await getContext(
    prizePool,
    marketRate,
    readProvider,
  );
  printContext(context);

  // #2. Get data about how much rewards a prize claimer can withdraw
  printSpacer();
  console.log(chalk.blue(`2. Getting claim rewards balance for '${relayerAddress}' ...`));
  const amount = await prizePool.balanceOfClaimRewards(relayerAddress);

  logBigNumber(
    `${context.rewardsToken.symbol} balance:`,
    amount,
    context.rewardsToken.decimals,
    context.rewardsToken.symbol,
  );
  const rewardsTokenUsd =
    parseFloat(ethers.utils.formatUnits(amount, context.rewardsToken.decimals)) *
    context.rewardsToken.assetRateUsd;
  console.log(
    chalk.dim(`${context.rewardsToken.symbol} balance (USD):`),
    chalk.greenBright(`$${roundTwoDecimalPlaces(rewardsTokenUsd)}`),
  );

  let populatedTx: PopulatedTransaction;

  const withdrawClaimRewardsParams: WithdrawClaimRewardsParams = {
    rewardsRecipient,
    amount,
  };

  // #3. Decide if profitable or not
  const profitable = await calculateProfit(
    chainId,
    contracts,
    marketRate,
    prizePool,
    rewardsTokenUsd,
    withdrawClaimRewardsParams,
    readProvider,
    minProfitThresholdUsd,
  );
  if (!profitable) {
    printAsterisks();
    console.log(chalk.yellow(`Not profitable to claim rewards yet. Exiting ...`));
  } else {
    printAsterisks();
    console.log(chalk.blue(`5. Creating transaction ...`));

    console.log(chalk.green('WithdrawClaimRewards: Add Populated Claim Tx'));
    populatedTx = await prizePool.populateTransaction.withdrawClaimRewards(
      ...Object.values(withdrawClaimRewardsParams),
    );
  }

  return populatedTx;
}

/**
 * Gather information about the given prize pool's fee token, fee token price in USD
 * and the last drawId
 * @returns {Promise} Promise of a WithdrawClaimRewardsContext object
 */
const getContext = async (
  prizePool: Contract,
  marketRate: Contract,
  readProvider: Provider,
): Promise<WithdrawClaimRewardsContext> => {
  const rewardsTokenAddress = await prizePool.prizeToken();

  const tokenInContract = new ethers.Contract(rewardsTokenAddress, ERC20Abi, readProvider);

  const rewardsToken: Token = {
    address: rewardsTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol(),
  };

  const rewardsTokenWithRate = {
    ...rewardsToken,
    assetRateUsd: await getRewardsTokenRateUsd(marketRate, rewardsToken),
  };

  return { rewardsToken: rewardsTokenWithRate };
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = (context) => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Rewards/prize token: ${context.rewardsToken.symbol}`));
  printSpacer();

  logTable({ rewardsToken: context.rewardsToken });
  logStringValue(
    `Rewards Token '${context.rewardsToken.symbol}' MarketRate USD:`,
    `$${context.rewardsToken.assetRateUsd}`,
  );
};

/**
 * Finds the spot price of the reward token in USD
 * @returns {number} rewardTokenRateUsd
 */
const getRewardsTokenRateUsd = async (
  marketRate: Contract,
  rewardToken: Token,
): Promise<number> => {
  const rewardTokenAddress = rewardToken.address;
  const rewardTokenRate = await marketRate.priceFeed(rewardTokenAddress, 'USD');

  return parseBigNumberAsFloat(rewardTokenRate, MARKET_RATE_CONTRACT_DECIMALS);
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
  rewardsTokenUsd: number,
  withdrawClaimRewardsParams: WithdrawClaimRewardsParams,
  readProvider: Provider,
  minProfitThresholdUsd: number,
): Promise<Boolean> => {
  const gasTokenMarketRateUsd = await getGasTokenMarketRateUsd(contracts, marketRate);

  printAsterisks();
  console.log(chalk.blue('3. Current gas costs for transaction:'));

  let estimatedGasLimit;
  try {
    estimatedGasLimit = await prizePool.estimateGas.withdrawClaimRewards(
      ...Object.values(withdrawClaimRewardsParams),
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

  const grossProfitUsd = rewardsTokenUsd;
  const netProfitUsd = grossProfitUsd - maxFeeUsd;

  console.log(chalk.magenta('Gross profit = tokenOut - tokenIn'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(grossProfitUsd)} = $${roundTwoDecimalPlaces(rewardsTokenUsd)}`,
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

  return profitable;
};
