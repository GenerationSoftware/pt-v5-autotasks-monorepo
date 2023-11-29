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
  getNativeTokenMarketRateUsd,
  roundTwoDecimalPlaces,
  getEthMainnetTokenMarketRateUsd,
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
  const { chainId, rewardsRecipient, relayerAddress, minProfitThresholdUsd, covalentApiKey } =
    params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePoolContract = getContract(
    'PrizePool',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );

  if (!prizePoolContract) {
    throw new Error('WithdrawRewards: PrizePool Contract Unavailable');
  }

  // #1. Get context about the prize pool prize token, etc
  const context: WithdrawClaimRewardsContext = await getContext(
    prizePoolContract,
    readProvider,
    covalentApiKey,
  );
  printContext(context);

  printAsterisks();

  // #2. Get data about how much rewards a prize claimer can withdraw
  printSpacer();
  console.log(chalk.blue(`2. Getting claim rewards balance for relayer '${relayerAddress}' ...`));
  const amount = await prizePoolContract.balanceOfClaimRewards(relayerAddress);

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

  // #2b. Get data about how rewards balance for rewards recipient, and print note that they would need to withdraw it themselves
  printSpacer();
  console.log(
    chalk.blue(`2. Getting claim rewards balance for rewards recipient '${rewardsRecipient}' ...`),
  );
  const rewardsRecipientAmount = await prizePoolContract.balanceOfClaimRewards(rewardsRecipient);

  if (rewardsRecipientAmount.gt(0)) {
    logBigNumber(
      `${context.rewardsToken.symbol} balance:`,
      rewardsRecipientAmount,
      context.rewardsToken.decimals,
      context.rewardsToken.symbol,
    );
    const rewardsRecipientRewardsTokenUsd =
      parseFloat(ethers.utils.formatUnits(rewardsRecipientAmount, context.rewardsToken.decimals)) *
      context.rewardsToken.assetRateUsd;
    console.log(
      chalk.dim(`${context.rewardsToken.symbol} balance (USD):`),
      chalk.greenBright(`$${roundTwoDecimalPlaces(rewardsRecipientRewardsTokenUsd)}`),
    );

    printSpacer();
    printNote();
  }

  // #3. Decide if profitable or not
  let populatedTx: PopulatedTransaction;

  const withdrawClaimRewardsParams: WithdrawClaimRewardsParams = {
    rewardsRecipient,
    amount,
  };

  const profitable = await calculateProfit(
    chainId,
    prizePoolContract,
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
    populatedTx = await prizePoolContract.populateTransaction.withdrawClaimRewards(
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
  prizePoolContract: Contract,
  readProvider: Provider,
  covalentApiKey?: string,
): Promise<WithdrawClaimRewardsContext> => {
  const rewardsTokenAddress = await prizePoolContract.prizeToken();

  const tokenInContract = new ethers.Contract(rewardsTokenAddress, ERC20Abi, readProvider);

  const rewardsToken: Token = {
    address: rewardsTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol(),
  };

  const rewardsTokenWithRate = {
    ...rewardsToken,
    assetRateUsd: await getEthMainnetTokenMarketRateUsd(
      rewardsToken.symbol,
      rewardsToken.address,
      covalentApiKey,
    ),
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
  prizePoolContract: Contract,
  rewardsTokenUsd: number,
  withdrawClaimRewardsParams: WithdrawClaimRewardsParams,
  readProvider: Provider,
  minProfitThresholdUsd: number,
): Promise<Boolean> => {
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  printAsterisks();
  console.log(chalk.blue('3. Current gas costs for transaction:'));

  printSpacer();
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await prizePoolContract.estimateGas.withdrawClaimRewards(
      ...Object.values(withdrawClaimRewardsParams),
    );
  } catch (e) {
    console.error(chalk.red(e));
  }

  const populatedTx = await prizePoolContract.populateTransaction.swapExactAmountOut(
    ...Object.values(withdrawClaimRewardsParams),
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

  logBigNumber(
    'Estimated gas limit (wei):',
    estimatedGasLimit,
    18,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );

  printSpacer();
  logTable({ avgFeeUsd });

  printAsterisks();
  console.log(chalk.blue('4. Profit/Loss (USD):'));
  printSpacer();

  const grossProfitUsd = rewardsTokenUsd;
  const netProfitUsd = grossProfitUsd - avgFeeUsd;

  console.log(chalk.magenta('Gross profit = tokenOut - tokenIn'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(grossProfitUsd)} = $${roundTwoDecimalPlaces(rewardsTokenUsd)}`,
    ),
  );
  printSpacer();

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

  return profitable;
};

const printNote = () => {
  console.log(chalk.yellow('|*******************************************************|'));
  console.log(chalk.yellow('|                                                       |'));
  console.log(chalk.yellow('|      Prize claim rewards can only be claimed by       |'));
  console.log(chalk.yellow('|      the address with the balanceOfClaimRewards       |'));
  console.log(chalk.yellow('|                                                       |'));
  console.log(chalk.yellow('|*******************************************************|'));
};
