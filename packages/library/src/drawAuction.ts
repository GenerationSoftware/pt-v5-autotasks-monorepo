import { ethers, BigNumber, Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { Relayer } from 'defender-relay-client';
import { formatUnits } from '@ethersproject/units';
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
import { ERC20Abi } from './abis/ERC20Abi';

// RngAuction.sol;
interface CompleteAuctionTxParams {
  rewardRecipient: string;
}

interface AuctionContracts {
  prizePoolContract: Contract;
  rngAuctionContract: Contract;
  rngRelayAuctionContract: Contract;
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
  const rngAuctionContract = getContract('RngAuction', chainId, readProvider, contracts, version);
  const rngRelayAuctionContract = getContract(
    'RngRelayAuction',
    chainId,
    readProvider,
    contracts,
    version,
  );
  const marketRateContract = getContract('MarketRate', chainId, readProvider, contracts, version);

  if (!prizePoolContract || !rngAuctionContract || !rngRelayAuctionContract) {
    throw new Error('Contract Unavailable');
  }

  return { prizePoolContract, rngAuctionContract, rngRelayAuctionContract, marketRateContract };
};

/**
 * Figures out the current state of the Rng / RngRelay Auction and if it's profitable
 * to run any of the transactions, populates and returns the tx object
 *
 * @returns {undefined} void function
 */
export async function prepareDrawAuctionTxs(
  contracts: ContractsBlob,
  relayer: Relayer,
  params: DrawAuctionConfigParams,
): Promise<undefined> {
  const { chainId, relayerAddress, rewardRecipient, writeProvider, readProvider, covalentApiKey } =
    params;

  const auctionContracts = getAuctionContracts(chainId, readProvider, contracts);

  // #1. Get info about the prize pool prize/reserve token, auction states, etc.
  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    chainId,
    readProvider,
    auctionContracts,
    relayerAddress,
    rewardRecipient,
    covalentApiKey,
  );

  printContext(chainId, context);

  if (!context.rngIsAuctionOpen && !context.rngRelayIsAuctionOpen) {
    printAsterisks();
    console.log(chalk.yellow(`Currently no Rng or RngRelay auctions to complete. Exiting ...`));
    return;
  }

  printSpacer();
  printAsterisks();

  // #2. Figure out if we need to run completeAuction on RngAuction or RngRelayAuction contract
  const contract = determineContractToUse(context, auctionContracts);

  // #3. If there is an RNG Fee, figure out if the bot can afford it
  await optionallyIncreaseRngFeeAllowance(writeProvider, relayerAddress, context);

  // #4. Estimate gas costs
  const gasCostUsd = await getGasCost(readProvider, contract, params, context);

  // #5. Find reward in USD
  const rewardUsd =
    contract === auctionContracts.rngAuctionContract
      ? context.rngExpectedRewardUsd
      : context.rngRelayExpectedRewardUsd;

  // #6. Decide if profitable or not
  const profitable = await calculateProfit(params, rewardUsd, gasCostUsd, context.rngFeeUsd);

  // #7. Populate transaction
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
 * Determines if the transaction will be profitable.
 *
 * Takes into account the cost of gas, the cost of the reward fee (in the case of an RngAuction start request),
 * and the rewards earned.
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateProfit = async (
  params: DrawAuctionConfigParams,
  rewardUsd: number,
  gasCostUsd: number,
  rngFeeUsd: number,
): Promise<boolean> => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`2. Calculating profit ...`));

  printAsterisks();
  console.log(chalk.magenta('Profit/Loss (USD):'));
  printSpacer();

  const grossProfitUsd = rewardUsd;
  console.log(chalk.magenta('(Gross Profit) = Reward'));
  const netProfitUsd = grossProfitUsd - gasCostUsd - rngFeeUsd;

  if (rngFeeUsd === 0) {
    console.log(chalk.magenta('(Net profit) = (Gross Profit) - (Gas Fees [Max])'));
    console.log(
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
          rewardUsd,
        )} - $${roundTwoDecimalPlaces(gasCostUsd)})`,
      ),
      chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${gasCostUsd})`),
    );
  } else {
    console.log(chalk.magenta('(Net profit) = (Gross Profit - Gas Fees [Max] - RNG Fee)'));
    console.log(
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
          rewardUsd,
        )} - $${roundTwoDecimalPlaces(gasCostUsd)}) - $${roundTwoDecimalPlaces(rngFeeUsd)})`,
      ),
      chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${gasCostUsd} - $${rngFeeUsd})`),
    );
  }

  printSpacer();

  const profitable = netProfitUsd > params.minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${params.minProfitThresholdUsd}`,
    'Net Profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
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
  console.log(chalk.blue.bold(`1a. Reward token: ${context.rewardToken.symbol}`));

  if (context.rngFeeTokenIsSet) {
    printSpacer();
    console.log(chalk.blue.bold(`1b. RNG Fee token: ${context.rngFeeToken.symbol}`));
    logBigNumber(
      `1c. RNG Fee:`,
      context.rngFee,
      context.rngFeeToken.decimals,
      context.rngFeeToken.symbol,
    );
  }

  printSpacer();
  logStringValue(
    `2. Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${context.gasTokenMarketRateUsd}`,
  );

  printSpacer();
  logStringValue(`3a. (RngAuction) Auction open? `, `${context.rngIsAuctionOpen}`);
  logBigNumber(
    `3b. (RngAuction) Expected Reward:`,
    context.rngExpectedReward,
    context.rewardToken.decimals,
    context.rewardToken.symbol,
  );
  console.log(
    chalk.grey(`(RngAuction) Expected Reward (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(context.rngExpectedRewardUsd)}`),
    chalk.dim(`$${context.rngExpectedRewardUsd}`),
  );

  printSpacer();
  logStringValue(`4a. (RngRelayAuction) Auction open? `, `${context.rngRelayIsAuctionOpen}`);
  logBigNumber(
    `4b. (RngRelayAuction) Expected Reward:`,
    context.drawExpectedReward,
    context.rewardToken.decimals,
    context.rewardToken.symbol,
  );
  console.log(
    chalk.grey(`(RngRelayAuction) Expected Reward (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(context.rngRelayExpectedRewardUsd)}`),
    chalk.dim(`$${context.rngRelayExpectedRewardUsd}`),
  );

  console.log('rng fee token!');
  console.log('rngFeeUsd');
  console.log(context.rngFeeUsd);
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
    context.nativeTokenMarketRateUsd,
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
  let contract = context.rngIsAuctionOpen
    ? auctionContracts.rngAuctionContract
    : auctionContracts.rngRelayAuctionContract;

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

const optionallyIncreaseRngFeeAllowance = async (
  writeProvider: Provider | DefenderRelaySigner,
  relayerAddress: string,
  context: DrawAuctionContext,
) => {
  if (context.rngIsAuctionOpen && context.rngFeeAmount.gt(0)) {
    // Bot/Relayer can't afford RNG fee
    if (context.relayer.rngFeeTokenBalance.lt(context.rngFeeAmount)) {
      const diff = context.rngFeeAmount.sub(context.relayer.rngFeeTokenBalance);
      const diffStr = parseFloat(formatUnits(diff, context.rngFeeToken.decimals));

      console.warn(
        chalk.yellow(
          `Need to increase relayer/bot's balance of '${context.rngFeeToken.symbol}' token by ${diffStr} to pay RNG fee.`,
        ),
      );
    }

    // Increase allowance if necessary - so the RNG Auction contract can spend the bot's RNG Fee Token
    approve(writeProvider, relayerAddress, context);
  }
};

/**
 * Allowance - Give permission to the RngAuction contract to spend our Relayer/Bot's
 * RNG Fee Token (likely LINK). We will set allowance to max as we trust the security of the
 * RngAuction contract (you may want to change this!)
 * @returns {undefined} - void function
 */
const approve = async (
  writeProvider: Provider | DefenderRelaySigner,
  relayerAddress: string,
  context: DrawAuctionContext,
) => {
  try {
    const rngFeeTokenContract = new ethers.Contract(
      context.rngFeeToken.address,
      ERC20Abi,
      writeProvider,
    );

    const allowance = context.relayer.rngFeeTokenAllowance;

    if (allowance.lt(context.rngFeeAmount)) {
      console.log(
        chalk.bgBlack.yellowBright(
          `Increasing relayer '${relayerAddress}' ${context.rngFeeToken.symbol} allowance for the RngAuction to maximum ...`,
        ),
      );

      const tx = await rngFeeTokenContract.approve(
        context.rngFeeToken.address,
        ethers.constants.MaxInt256,
      );
      await tx.wait();

      const newAllowanceResult = await rngFeeTokenContract.functions.allowance(
        relayerAddress,
        context.rngFeeToken.address,
      );
      logStringValue('New allowance:', newAllowanceResult[0].toString());
    } else {
      console.log(chalk.green('Sufficient allowance ✔'));
    }
  } catch (error) {
    console.log(chalk.red('error: ', error));
  }
};
