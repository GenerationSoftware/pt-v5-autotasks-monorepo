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
  roundTwoDecimalPlaces,
} from './utils';
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';
import { getDrawAuctionContextMulticall } from './utils/getDrawAuctionContextMulticall';

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

interface AuctionContracts {
  prizePoolContract: Contract;
  rngAuctionContract: Contract;
  drawAuctionContract: Contract;
  marketRateContract: Contract;
}

const getAuctionContracts = (
  chainId: number,
  readProvider: Provider,
  contracts: ContractsBlob,
): AuctionContracts => {
  const version = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePoolContract = getContract('PrizePool', chainId, readProvider, contracts, version);
  const rngAuctionContract = getContract('RNGAuction', chainId, readProvider, contracts, version);
  const drawAuctionContract = getContract('DrawAuction', chainId, readProvider, contracts, version);
  const marketRateContract = getContract('MarketRate', chainId, readProvider, contracts, version);

  if (!prizePoolContract || !rngAuctionContract || !drawAuctionContract) {
    throw new Error('Contract Unavailable');
  }

  return { prizePoolContract, rngAuctionContract, drawAuctionContract, marketRateContract };
};

/**
 * Figures out the current state of the RNG / Draw Auction and if it's profitable
 * to run any of the transactions, populates and returns the tx object
 *
 * @returns {undefined} void function
 */
export async function prepareDrawAuctionTxs(
  contracts: ContractsBlob,
  relayer: Relayer,
  readProvider: Provider,
  params: DrawAuctionConfigParams,
): Promise<undefined> {
  const { chainId, rewardRecipient } = params;

  const auctionContracts = getAuctionContracts(chainId, readProvider, contracts);

  // #1. Get context about the prize pool prize token, etc
  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    readProvider,
    auctionContracts,
  );

  printContext(chainId, context);

  if (!context.isRngAuctionOpen) {
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
    auctionContracts,
    params,
    context,
  );

  // #6. Populate transaction
  if (profitable) {
    printSpacer();
    console.log(chalk.green(`Execute Start RNG Auction`));
    printSpacer();

    const isPrivate = canUseIsPrivate(chainId, params.useFlashbots);

    console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
    printSpacer();

    const txParams = buildParams(params.rewardRecipient);
    const populatedTx =
      await auctionContracts.rngAuctionContract.populateTransaction.startRNGRequest(
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
  auctionContracts: AuctionContracts,
  txParams: TxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await auctionContracts.rngAuctionContract.estimateGas.startRNGRequest(
      ...Object.values(txParams),
    );
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
};

/**
 * Determines if the transaction will be profitable
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateProfit = async (
  readProvider: Provider,
  chainId: number,
  auctionContracts: AuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
): Promise<boolean> => {
  printSpacer();
  const totalCostUsd = await getGasCost(readProvider, chainId, auctionContracts, params, context);

  printAsterisks();
  console.log(chalk.magenta('5c. Profit/Loss (USD):'));
  printSpacer();

  const reward = context.currentRewardPortionRng;
  console.log('reward');
  console.log(reward);
  console.log(reward.toString());

  const rewardUsd = context.rewardToken.assetRateUsd * reward;
  console.log('rewardUsd');
  console.log(rewardUsd);
  console.log(rewardUsd.toString());

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

  const profitable = netProfitUsd > params.minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${params.minProfitThresholdUsd}`,
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

  logStringValue(`Is RNG Auction open?: `, `${context.isRngAuctionOpen}`);
};

const buildParams = (rewardRecipient: string): TxParams => {
  return {
    rewardRecipient,
  };
};

const getGasCost = async (
  readProvider: Provider,
  chainId: number,
  auctionContracts: AuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
): Promise<number> => {
  let txParams = buildParams(params.rewardRecipient);

  let estimatedGasLimit = await getEstimatedGasLimit(auctionContracts, txParams);
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
    context.gasTokenMarketRateUsd,
    readProvider,
  );
  console.log(
    chalk.grey(`Gas Cost (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(gasCostUsd)}`),
    chalk.dim(`$${gasCostUsd}`),
  );

  return gasCostUsd;
};
