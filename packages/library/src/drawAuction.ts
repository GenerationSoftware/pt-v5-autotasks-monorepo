import { BigNumber, Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';
import { Relayer } from 'defender-relay-client';
import chalk from 'chalk';

import { DrawAuctionContext, DrawAuctionConfigParams } from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  canUseIsPrivate,
  getGasTokenMarketRateUsd,
  roundTwoDecimalPlaces,
} from './utils';
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';

// RNGAuction.sol;
// interface StartRngRequestParams {
//   rewardRecipient: string;
// }

// interface CompleteDrawParams {
//   rewardRecipient: string;
// }

interface TxParams {
  rewardRecipient: string;
}

// // RNGAuction.sol;
//
// isRNGRequested;
// isRNGCompleted;
// isRNGAuctionOpen;

// rngAuctionElapsedTime;
// getRNGRequest;
// getRNGRequestId;
// getRNGService;
// getDrawPeriodOffset;
// getDrawPeriod;
// getAuctionDuration;

// startRNGRequest;

// // DrawAuction.sol
//
// auctionName;
//
// completeDraw;

// originChainId;

const getDrawAuctionContracts = (
  chainId: number,
  readProvider: Provider,
  contracts: ContractsBlob,
) => {
  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const rngAuctionContract = getContract(
    'RNGAuction',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );
  const drawAuctionContract = getContract(
    'DrawAuction',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );
  const marketRateContract = getContract(
    'MarketRate',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );

  return { rngAuctionContract, drawAuctionContract, marketRateContract };
};

/**
 * Finds all winners for the current draw who have unclaimed prizes and decides if it's profitable
 * to claim for them. The fees the drawAuction bot can earn increase exponentially over time.
 *
 * @returns {undefined} void function
 */
export async function prepareDrawAuctionTxs(
  contracts: ContractsBlob,
  relayer: Relayer,
  readProvider: Provider,
  params: DrawAuctionConfigParams,
): Promise<undefined> {
  const { chainId, rewardRecipient, useFlashbots, minProfitThresholdUsd } = params;

  const { rngAuctionContract, drawAuctionContract, marketRateContract } = getDrawAuctionContracts(
    chainId,
    readProvider,
    contracts,
  );

  if (!rngAuctionContract || !drawAuctionContract) {
    throw new Error('Contract Unavailable');
  }

  // TODO: Figure out how to get drawAuction, rngAuction contracts ... ?

  // #1. Get context about the prize pool prize token, etc
  const context: DrawAuctionContext = await getContext(
    chainId,
    readProvider,
    contracts,
    rngAuctionContract,
    drawAuctionContract,
    marketRateContract,
  );
  printContext(chainId, context);

  // #2. Get data from v5-draw-results
  // let claims = await fetchClaims(chainId, prizePool.address, context.drawId);

  const nothingToDo = rngAuctionContract.isRNGAuctionOpen;

  if (nothingToDo) {
    printAsterisks();
    console.log(chalk.yellow(`Currently no profitable transactions to make. Exiting ...`));
    return;
  }

  printSpacer();
  printAsterisks();

  // #5. Decide if profitable or not
  printSpacer();
  console.log(chalk.blue(`5a. Calculating profit ...`));

  const profitable = await calculateProfit(
    readProvider,
    chainId,
    contracts,
    drawAuctionContract,
    rewardRecipient,
    minProfitThresholdUsd,
    marketRateContract,
    context,
  );

  // #6. Populate transaction
  if (profitable) {
    printSpacer();
    console.log(chalk.green(`Execute Start RNG Auction`));
    printSpacer();

    const isPrivate = canUseIsPrivate(chainId, useFlashbots);

    console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
    printSpacer();

    const txParams = buildParams(rewardRecipient);
    const populatedTx = await drawAuctionContract.populateTransaction.startRNGRequest(
      ...Object.values(txParams),
    );

    console.log(chalk.greenBright.bold(`Sending transaction ...`));
    const tx = await relayer.sendTransaction({
      isPrivate,
      data: populatedTx.data,
      to: populatedTx.to,
      gasLimit: 8000000,
    });

    console.log(chalk.greenBright.bold('Transaction sent! ✔'));
    console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

    // NOTE: This uses a naive method of waiting for the tx since OZ Defender can
    //       re-submit transactions, effectively giving them different tx hashes
    //       It is likely good enough for these types of transactions but could cause
    //       issues if there are a lot of failures or gas price issues
    //       See querying here:
    //       https://github.com/OpenZeppelin/defender-client/tree/master/packages/relay#querying-transactions
    console.log('Waiting on transaction to be confirmed ...');
    await readProvider.waitForTransaction(tx.hash);
    console.log('Tx confirmed !');
  }
}

/**
 * Figures out how much gas is required to run the contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getEstimatedGasLimit = async (
  drawAuction: Contract,
  txParams: TxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await drawAuction.estimateGas.claimPrizes(...Object.values(txParams));
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
};

/**
 * Determines if the claim transaction will be profitable
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateProfit = async (
  readProvider: Provider,
  chainId: number,
  contracts: ContractsBlob,
  drawAuctionContract: Contract,
  rewardRecipient: string,
  minProfitThresholdUsd: number,
  marketRateContract: Contract,
  context: DrawAuctionContext,
): Promise<boolean> => {
  printSpacer();
  const totalCostUsd = await getGasCost(
    readProvider,
    chainId,
    drawAuctionContract,
    rewardRecipient,
    context.gasTokenMarketRateUsd,
  );

  printAsterisks();
  console.log(chalk.magenta('5c. Profit/Loss (USD):'));
  printSpacer();

  const rewardUsd = 1234.123;

  // FEES USD
  const netProfitUsd = rewardUsd - totalCostUsd;
  console.log(chalk.magenta('Net profit = (Earned fees - Gas cost [Max])'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        rewardUsd,
      )} - $${roundTwoDecimalPlaces(totalCostUsd)})`,
    ),
    chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${totalCostUsd})`),
  );
  printSpacer();

  const profitable = netProfitUsd > minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${minProfitThresholdUsd}`,
    'Net profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    'Profitable?': profitable ? '✔' : '✗',
  });
  printSpacer();

  if (profitable) {
    console.log(chalk.yellow(`Submitting transaction:`));
  } else {
    // console.log(
    //   chalk.yellow(`Starting RNG currently not profitable.`),
    // );
  }

  return profitable;
};

/**
 * Gather information about the draw auction
 * and the last drawId
 * @returns {Promise} Promise of a DrawAuctionContext object
 */
const getContext = async (
  chainId: number,
  readProvider: Provider,
  contracts: ContractsBlob,
  rngAuctionContract: Contract,
  drawAuctionContract: Contract,
  marketRateContract: Contract,
): Promise<DrawAuctionContext> => {
  printSpacer();
  const gasTokenMarketRateUsd = await getGasTokenMarketRateUsd(contracts, marketRateContract);

  const isRNGAuctionOpen = await rngAuctionContract.isRNGAuctionOpen();

  return { gasTokenMarketRateUsd, isRNGAuctionOpen };
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = (chainId, context) => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Reward token: ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol}`));
  printSpacer();

  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    context.gasTokenMarketRateUsd,
  );

  logStringValue(`Is RNG Auction open?: `, `${context.isRNGAuctionOpen}`);
};

const buildParams = (rewardRecipient: string): TxParams => {
  return {
    rewardRecipient,
  };
};

const getGasCost = async (
  readProvider: Provider,
  chainId: number,
  drawAuction: Contract,
  rewardRecipient: string,
  gasTokenMarketRateUsd: number,
): Promise<number> => {
  let txParams = buildParams(rewardRecipient);

  let estimatedGasLimit = await getEstimatedGasLimit(drawAuction, txParams);
  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellow('Estimated gas limit is 0 ...'));
  } else {
    logBigNumber(
      'Estimated gas limit:',
      estimatedGasLimit,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
    );
  }

  printSpacer();

  logBigNumber(
    'Gas Cost (wei):',
    estimatedGasLimit,
    NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );

  // 3. Convert gas costs to USD
  printSpacer();
  const { maxFeeUsd: gasCostUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    gasTokenMarketRateUsd,
    readProvider,
  );
  console.log(
    chalk.grey(`Gas Cost (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(gasCostUsd)}`),
    chalk.dim(`$${gasCostUsd}`),
  );

  return gasCostUsd;
};
