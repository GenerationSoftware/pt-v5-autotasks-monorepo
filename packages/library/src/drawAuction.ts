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
interface CompleteAuctionTxParams {
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
  const { chainId } = params;

  const auctionContracts = getAuctionContracts(chainId, readProvider, contracts);

  // #1. Get info about the prize pool prize/reserve token, auction states, etc.
  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    readProvider,
    auctionContracts,
  );

  printContext(chainId, context);

  if (context.rngIsAuctionComplete || context.drawIsAuctionComplete) {
    printAsterisks();
    console.log(chalk.yellow(`Currently no RNG or Draw auctions to complete. Exiting ...`));
    return;
  }

  printSpacer();
  printAsterisks();

  // #2. Figure out if we need to run completeAuction on RNGAuction or DrawAuction contract
  const contract = determineContractToUse(context, auctionContracts);

  // #3. Estimate gas costs
  const totalCostUsd = await getGasCost(readProvider, contract, params, context);

  // #4. Find reward in USD
  const rewardUsd =
    contract === auctionContracts.rngAuctionContract ? context.rngRewardUsd : context.drawRewardUsd;

  // #5. Decide if profitable or not
  const profitable = await calculateProfit(params, rewardUsd, totalCostUsd);

  // #6. Populate transaction
  if (profitable) {
    const tx = await sendTransaction(relayer, auctionContracts, params);

    // NOTE: This uses a naive method of waiting for the tx since OZ Defender can
    //       re-submit transactions, effectively giving them different tx hashes
    //       It is likely good enough for these types of transactions but could cause
    //       issues if there are a lot of failures or gas price issues
    //       See querying here:
    //       https://github.com/OpenZeppelin/defender-client/tree/master/packages/relay#querying-transactions
    console.log('Waiting on transaction to be confirmed ...');
    await readProvider.waitForTransaction(tx.hash);
    console.log('Tx confirmed !');
  } else {
    console.log(
      chalk.yellow(`Completing current auction currently not profitable. Will try again soon ...`),
    );
  }
}

/**
 * Figures out how much gas is required to run the contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getEstimatedGasLimit = async (
  contract: Contract,
  completeAuctionTxParams: CompleteAuctionTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await contract.estimateGas.completeAuction(
      ...Object.values(completeAuctionTxParams),
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
  params: DrawAuctionConfigParams,
  rewardUsd: number,
  totalCostUsd: number,
): Promise<boolean> => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`2. Calculating profit ...`));

  printAsterisks();
  console.log(chalk.magenta('Profit/Loss (USD):'));
  printSpacer();

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
    `2. Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    context.gasTokenMarketRateUsd,
  );

  logStringValue(`3a. (RNG) Auction complete? `, `${context.rngIsAuctionComplete}`);
  logStringValue(`3b. (RNG) Current reward portion: `, `${context.rngCurrentRewardPortion}`);

  logStringValue(`4a. (Draw) Auction complete? `, `${context.drawIsAuctionComplete}`);
  logStringValue(`4b. (Draw) Current reward portion: `, `${context.drawCurrentRewardPortion}`);
};

const buildParams = (rewardRecipient: string): CompleteAuctionTxParams => {
  return {
    rewardRecipient,
  };
};

const getGasCost = async (
  readProvider: Provider,
  contract: Contract,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
): Promise<number> => {
  let completeAuctionTxParams = buildParams(params.rewardRecipient);

  let estimatedGasLimit = await getEstimatedGasLimit(contract, completeAuctionTxParams);
  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellow('Estimated gas limit is 0 ...'));
  } else {
    logBigNumber(
      'Estimated gas limit:',
      estimatedGasLimit,
      NETWORK_NATIVE_TOKEN_INFO[params.chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[params.chainId].symbol,
    );
  }

  printSpacer();

  logBigNumber(
    'Gas Cost (wei):',
    estimatedGasLimit,
    NETWORK_NATIVE_TOKEN_INFO[params.chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[params.chainId].symbol,
  );

  // 3. Convert gas costs to USD
  printSpacer();
  const { maxFeeUsd: gasCostUsd } = await getFeesUsd(
    params.chainId,
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

const determineContractToUse = (
  context: DrawAuctionContext,
  auctionContracts: AuctionContracts,
): Contract => {
  let contract = !context.rngIsAuctionComplete
    ? auctionContracts.rngAuctionContract
    : auctionContracts.drawAuctionContract;

  return contract;
};

const sendTransaction = async (
  relayer: Relayer,
  auctionContracts: AuctionContracts,
  params: DrawAuctionConfigParams,
) => {
  console.log(chalk.yellow(`Submitting transaction:`));
  printSpacer();
  console.log(chalk.green(`Execute Start RNG Auction`));
  printSpacer();

  const isPrivate = canUseIsPrivate(params.chainId, params.useFlashbots);

  console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
  printSpacer();

  const completeAuctionTxParams = buildParams(params.rewardRecipient);
  const populatedTx = await auctionContracts.rngAuctionContract.populateTransaction.completeAuction(
    ...Object.values(completeAuctionTxParams),
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

  return tx;
};
