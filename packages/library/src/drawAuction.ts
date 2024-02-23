import { ethers, BigNumber, Contract, PopulatedTransaction, Wallet, Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract, getContracts } from '@generationsoftware/pt-v5-utils-js';
import { formatUnits } from '@ethersproject/units';
import { Relayer } from 'defender-relay-client';
import chalk from 'chalk';

import { RngAuctionContracts, DrawAuctionContext, DrawAuctionConfig } from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  roundTwoDecimalPlaces,
  getGasPrice,
} from './utils';
import { chainName } from './utils/network';
import { CHAIN_IDS, NETWORK_NATIVE_TOKEN_INFO } from './constants/network';
import {
  getDrawAuctionContextMulticall,
  DrawAuctionState,
} from './utils/getDrawAuctionContextMulticall';
import { ERC20Abi } from './abis/ERC20Abi';
import { sendPopulatedTx } from './helpers/sendPopulatedTx';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

interface StartRngRequestTxParams {
  rewardRecipient: string;
}

interface RngAuctionRelayerDirectRelayTxParams {
  rngAuctionRelayListenerAddress: string;
  rewardRecipient: string;
}

const MAX_FORCE_RELAY_LOSS_THRESHOLD_USD = -25;

const instantiateRngAuctionContracts = (
  config: DrawAuctionConfig,
  contracts: ContractsBlob,
): RngAuctionContracts => {
  const { chainId, provider } = config;

  const version = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  printSpacer();
  printSpacer();
  console.log(chalk.dim('Instantiating RNG contracts ...'));

  const prizePoolContract = getContract('PrizePool', chainId, provider, contracts, version);
  const rngAuctionContract = getContract('RngAuction', chainId, provider, contracts, version);
  const rngAuctionRelayerDirectContract = getContract(
    'RngAuctionRelayerDirect',
    chainId,
    provider,
    contracts,
    version,
  );
  const rngRelayAuctionContract = getContract(
    'RngRelayAuction',
    chainId,
    provider,
    contracts,
    version,
  );

  logTable({
    prizePoolContract: prizePoolContract.address,
    rngAuctionContract: rngAuctionContract.address,
    rngRelayAuctionContract: rngRelayAuctionContract.address,
    rngAuctionRelayerDirectContract: rngAuctionRelayerDirectContract.address,
  });

  return {
    prizePoolContract,
    rngAuctionContract,
    rngRelayAuctionContract,
    rngAuctionRelayerDirectContract,
  };
};

/**
 * Figures out the current state of the Rng / RngRelay Auction and if it's profitable
 * to run any of the transactions, populates and returns the tx object
 *
 * @returns {undefined} void function
 */
export async function runDrawAuction(
  contracts: ContractsBlob,
  config: DrawAuctionConfig,
): Promise<void> {
  const {
    chainId,
    provider,
    rngWallet,
    rngOzRelayer,
    rngRelayerAddress,
    signer,
    rewardRecipient,
    covalentApiKey,
  } = config;

  const rngAuctionContracts = instantiateRngAuctionContracts(config, contracts);

  // #1. Get info about the prize pool prize/reserve token, auction states, etc.
  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    chainId,
    provider,
    rngAuctionContracts,
    rngRelayerAddress,
    rewardRecipient,
    covalentApiKey,
  );

  printContext(chainId, context);

  if (!context.drawAuctionState) {
    printAsterisks();
    console.log(chalk.yellow(`Currently no Rng or RngRelay auctions to complete. Exiting ...`));
    printSpacer();

    return;
  }

  // #3. If there is an RNG Fee, figure out if the bot can afford it
  // if (context.drawAuctionState === DrawAuctionState.Start) {
  //   console.log(chalk.blue(`Checking Relayer's RNG Fee token balance ...`));
  //   printSpacer();

  //   const enoughBalance = checkBalance(context);
  //   if (!enoughBalance) {
  //     return;
  //   }

  //   await increaseRngFeeAllowance(signer, rngRelayerAddress, context, rngAuctionContracts);
  // }

  // #4. Calculate profit and send transactions when profitable
  let rewardUsd = 0;
  if (context.drawAuctionState === DrawAuctionState.Start) {
    rewardUsd = context.rngExpectedRewardTotalUsd;

    const gasCostUsd = await getRngGasCost(provider, rngAuctionContracts, config, context);
    if (gasCostUsd === 0) {
      printAsterisks();
      console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
      return;
    }

    const profitable = await calculateRngProfit(config, rewardUsd, gasCostUsd, context);

    if (profitable) {
      await sendStartRngTransaction(
        chainId,
        rngWallet,
        rngOzRelayer,
        provider,
        rngAuctionContracts,
        config,
      );
    } else {
      console.log(
        chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
      );
    }
  } else if (context.drawAuctionState === DrawAuctionState.Award) {
    console.log(chalk.yellow(`Processing 'award' for ${chainName(chainId)}:`));
    await processRelayTransaction(
      rngWallet,
      rngOzRelayer,
      rngAuctionContracts,
      config,
      context,
      contracts,
    );
  }
}

const sendStartRngTransaction = async (
  chainId: number,
  rngWallet: Wallet,
  rngOzRelayer: Relayer,
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  config: DrawAuctionConfig,
) => {
  console.log(chalk.yellow(`Start RNG Transaction:`));

  let populatedTx: PopulatedTransaction;
  console.log(chalk.green(`Execute rngAuction#startRngRequest`));
  printSpacer();

  const startRngRequestTxParams = buildStartRngRequestTxParams(config.rewardRecipient);
  const contract = rngAuctionContracts.rngAuctionContract;
  populatedTx = await contract.populateTransaction.startRngRequest(
    ...Object.values(startRngRequestTxParams),
  );

  const { gasPrice } = await getGasPrice(provider);
  console.log(chalk.greenBright.bold(`Sending ...`));

  const gasLimit = 150000;
  const tx = await sendPopulatedTx(
    chainId,
    rngOzRelayer,
    rngWallet,
    populatedTx,
    gasLimit,
    gasPrice,
    config.useFlashbots,
  );

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
  printSpacer();
  printNote();
};

// const recentRelayExists = async (
//   rngReadProvider: Provider,
//   contract: Contract,
// ): Promise<boolean> => {
//   const latestBlockNumber = await rngReadProvider.getBlockNumber();

//   let filter = contract.filters.RelayedToDispatcher();
//   let events = await contract.queryFilter(filter);
//   // 100 blocks is about 25 minutes worth of events
//   events = events.filter((event) => event.blockNumber > latestBlockNumber - 100);

//   return events.length > 0;
// };

const processRelayTransaction = async (
  rngWallet: Wallet,
  rngOzRelayer: Relayer,
  rngAuctionContracts: RngAuctionContracts,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  contracts: ContractsBlob,
) => {
  const { chainId, provider } = config;

  const contract = rngAuctionContracts.rngAuctionRelayerDirectContract;

  // #1. Check to see if a recent relay has been sent
  // const relayExists = await recentRelayExists(provider, contract);
  // if (relayExists) {
  //   console.log(chalk.dim(`Found a recent 'RelayedToDispatcher' event, skipping ...`));
  //   return;
  // } else {
  //   // console.log(`Did not find a recent 'RelayedToDispatcher' event, continuing ...`);
  // }

  // #2. Collect the transaction parameters
  const txParams = await getRelayTxParams(config, rngAuctionContracts);

  // #3. Get gas cost
  const gasCostUsd = await getRelayGasCost(txParams, contract, config, context);
  if (gasCostUsd === 0) {
    printAsterisks();
    console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
    return;
  }

  // #4. Decide if profitable or not
  const { netProfitUsd, profitable } = await calculateRelayProfit(
    config,
    context.rngRelayExpectedRewardUsd,
    gasCostUsd,
  );

  const forceRelay = calculateForceRelay(config, context, netProfitUsd);
  console.log('forceRelay');
  console.log(forceRelay);

  // #5. Send transaction
  if (profitable || forceRelay) {
    await sendRelayTransaction(chainId, rngWallet, rngOzRelayer, txParams, contract, config);
  } else {
    console.log(
      chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }
};

// If we already submitted the StartRNG request - and therefore paid the LINK/RNG fee
// and gas fee for it - we should make sure the relay goes through, assuming
// it was us who won the StartRNG auction, that the amount of loss we'll take is within
// acceptable range
const calculateForceRelay = (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  netProfitUsd: number,
) => {
  // Is recipient for the StartRNG auction same as the upcoming Relay?
  // (this is a bit naïve as the RNG reward recipient could differ from the relay reward recipient,
  //   but it's likely this will be the same address)
  const sameRecipient = context.rngLastAuctionResult.recipient === config.rewardRecipient;
  console.log('sameRecipient');
  console.log(sameRecipient);

  console.log('netProfitUsd');
  console.log(netProfitUsd);

  console.log('MAX_FORCE_RELAY_LOSS_THRESHOLD_USD');
  console.log(MAX_FORCE_RELAY_LOSS_THRESHOLD_USD);

  const lossOkay = netProfitUsd > MAX_FORCE_RELAY_LOSS_THRESHOLD_USD;
  console.log('lossOkay');
  console.log(lossOkay);

  return context.auctionClosesSoon && sameRecipient && lossOkay;
};

const checkBalance = (context: DrawAuctionContext): boolean => {
  logBigNumber(
    `Relayer RNG Fee Token Balance:`,
    context.rngRelayer.rngFeeTokenBalance,
    context.rngFeeToken.decimals,
    context.rngFeeToken.symbol,
  );

  // Bot/Relayer can't afford RNG fee
  if (context.rngRelayer.rngFeeTokenBalance.lt(context.rngFeeAmount)) {
    const diff = context.rngFeeAmount.sub(context.rngRelayer.rngFeeTokenBalance);
    const diffStr = parseFloat(formatUnits(diff, context.rngFeeToken.decimals));

    console.warn(
      chalk.yellow(
        `Need to increase RNG L1 relayer/bot's balance of '${context.rngFeeToken.symbol}' token by ${diffStr} to pay RNG fee.`,
      ),
    );

    return false;
  } else {
    console.log(chalk.green('Sufficient balance ✔'));

    printSpacer();
    const estimateCount = context.rngRelayer.rngFeeTokenBalance.div(context.rngFeeAmount);
    logStringValue(
      `Estimate DrawAuction RNG requests left at current balance:`,
      estimateCount.toString(),
    );
    return true;
  }
};

const printNote = () => {
  console.log(chalk.yellow('|*******************************************************|'));
  console.log(chalk.yellow('|                                                       |'));
  console.log(chalk.yellow('|   Rewards accumulate post-relay() on the PrizePool!   |'));
  console.log(chalk.yellow('|       Withdraw your rewards from the PrizePool        |'));
  console.log(chalk.yellow('|                                                       |'));
  console.log(chalk.yellow('|*******************************************************|'));
};

/**
 * Figures out how much gas is required to run the RngAuction startRngRequest contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getStartRngRequestEstimatedGasLimit = async (
  contract: Contract,
  startRngRequestTxParams: StartRngRequestTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await contract.estimateGas.startRngRequest(
      ...Object.values(startRngRequestTxParams),
    );
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
};

// /**
//  * Figures out how much gas is required to run the RngAuctionRelayerRemoteOwnerOptimism relay contract function
//  *
//  * @returns {Promise} Promise of a BigNumber with the gas limit
//  */
// const getRngAuctionRelayerRemoteOwnerOptimismRelayEstimatedGasLimit = async (
//   contract: Contract,
//   rngAuctionRelayerRemoteOwnerOptimismRelayTxParams: RngAuctionRelayerRemoteOwnerOptimismRelayTxParams,
// ): Promise<BigNumber> => {
//   let estimatedGasLimit;
//   try {
//     estimatedGasLimit = await contract.estimateGas.relay(
//       ...Object.values(rngAuctionRelayerRemoteOwnerOptimismRelayTxParams),
//     );
//   } catch (e) {
//     console.log(chalk.red(e));
//   }

//   return estimatedGasLimit;
// };

/**
 * Determines if the transaction will be profitable.
 *
 * Takes into account the cost of gas, the cost of the reward fee (in the case of an RngAuction start request),
 * and the rewards earned.
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateRngProfit = async (
  config: DrawAuctionConfig,
  rewardUsd: number,
  gasCostUsd: number,
  context: DrawAuctionContext,
): Promise<boolean> => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`Calculating profit ...`));

  printSpacer();
  console.log(chalk.magenta('Profit/Loss (USD):'));
  printSpacer();

  const grossProfitUsd = rewardUsd;
  console.log(chalk.magenta('Gross Profit = Reward'));

  const netProfitUsd = grossProfitUsd - gasCostUsd - context.rngFeeUsd;
  console.log(chalk.magenta('Net profit = (Gross Profit - Gas Fees [Max] - RNG Fee)'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        rewardUsd,
      )} - $${roundTwoDecimalPlaces(gasCostUsd)} - $${roundTwoDecimalPlaces(context.rngFeeUsd)})`,
    ),
    chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${gasCostUsd} - $${context.rngFeeUsd})`),
  );
  printSpacer();

  const profitable = netProfitUsd > config.minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${config.minProfitThresholdUsd}`,
    'Net Profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    'Profitable?': checkOrX(profitable),
  });
  printSpacer();

  return profitable;
};

/**
 * Determines if a Relay transaction will be profitable.
 *
 * Takes into account the cost of gas, the cost of the reward fee (in the case of an RngAuction start request),
 * and the rewards earned.
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateRelayProfit = async (
  config: DrawAuctionConfig,
  rewardUsd: number,
  gasCostUsd: number,
): Promise<{ netProfitUsd: number; profitable: boolean }> => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`Calculating profit ...`));

  printSpacer();
  console.log(chalk.magenta('Profit/Loss (USD):'));
  printSpacer();

  const grossProfitUsd = rewardUsd;
  console.log(chalk.magenta('Gross Profit = Reward'));

  const netProfitUsd = grossProfitUsd - gasCostUsd;
  console.log(chalk.magenta('Net profit = (Gross Profit - Gas Fees [Max])'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        rewardUsd,
      )} - $${roundTwoDecimalPlaces(gasCostUsd)})`,
    ),
    chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${gasCostUsd})`),
  );

  printSpacer();

  const profitable = netProfitUsd > config.minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${config.minProfitThresholdUsd}`,
    'Net Profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    'Profitable?': checkOrX(profitable),
  });
  printSpacer();

  return { netProfitUsd, profitable };
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = (chainId: number, context: DrawAuctionContext) => {
  printAsterisks();
  printSpacer();
  console.log(chalk.blue.bold(`Tokens:`));

  printSpacer();
  logStringValue(
    `1a. RNG Chain Native/Gas Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${context.nativeTokenMarketRateUsd}`,
  );

  logStringValue(
    `1b. RNG Fee Token:`,
    context.rngFeeTokenIsSet ? context.rngFeeToken.symbol : 'n/a',
  );
  if (context.rngFeeTokenIsSet) {
    logBigNumber(
      `1c. Relayer RNG Fee Token Balance:`,
      context.rngRelayer.rngFeeTokenBalance,
      context.rngFeeToken.decimals,
      context.rngFeeToken.symbol,
    );

    logStringValue(`1d. RNG Fee Token Market Rate (USD):`, `$${context.rngFeeToken.assetRateUsd}`);
    logBigNumber(
      `1e. RNG Fee Amount:`,
      context.rngFeeAmount,
      context.rngFeeToken.decimals,
      context.rngFeeToken.symbol,
    );
    logStringValue(`1f. RNG Fee Amount (USD):`, `$${context.rngFeeUsd}`);
    printSpacer();
  }

  printSpacer();
  logStringValue(
    `1c. Reward Token '${context.rewardToken.symbol}' Market Rate (USD):`,
    `$${context.rewardToken.assetRateUsd}`,
  );

  logStringValue(
    `1d. Relay Chain Gas Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${context.nativeTokenMarketRateUsd}`,
  );

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`Rng Auction State:`));

  printSpacer();
  logStringValue(`2a. (RngAuction) Auction open? `, `${checkOrX(context.rngIsAuctionOpen)}`);

  if (context.rngIsAuctionOpen) {
    printSpacer();
    logStringValue(
      `2b. (RngAuction) ${chainName(chainId)} Expected Reward:`,
      `${context.rngExpectedReward.toString()} ${context.rewardToken.symbol}`,
    );
    console.log(
      chalk.grey(`2c. (RngAuction) ${chainName(chainId)} Expected Reward (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(context.rngExpectedRewardUsd)}`),
      chalk.dim(`$${context.rngExpectedRewardUsd}`),
    );

    console.log(
      chalk.grey(`2d. (RngAuction) Expected Reward TOTAL (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(context.rngExpectedRewardTotalUsd)}`),
      chalk.dim(`$${context.rngExpectedRewardTotalUsd}`),
    );
  } else {
    printSpacer();

    logStringValue(
      `${chainName(chainId)} PrizePool can start RNG in:`,
      `${(context.prizePoolDrawClosesAt - Math.ceil(Date.now() / 1000)) / 60} minutes`,
    );
    printSpacer();
  }

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`RngRelay Auction State:`));

  logStringValue(`3a. Relay Auction open? `, `${checkOrX(context.rngRelayIsAuctionOpen)}`);
  if (context.rngRelayIsAuctionOpen) {
    logBigNumber(
      `3b. Relay Expected Reward:`,
      context.rngRelayExpectedReward.toString(),
      context.rewardToken.decimals,
      context.rewardToken.symbol,
    );
    console.log(
      chalk.grey(`3c. Relay Expected Reward (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(context.rngRelayExpectedRewardUsd)}`),
      chalk.dim(`$${context.rngRelayExpectedRewardUsd}`),
    );

    logStringValue(`3d. Relay Last Seq. ID:`, `${context.rngRelayLastSequenceId}`);
  }

  printSpacer();
};

const getRngGasCost = async (
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
): Promise<number> => {
  console.log(chalk.blue(`Estimating RNG gas costs ...`));
  printSpacer();

  let estimatedGasLimit, populatedTx;

  const startRngRequestTxParams = buildStartRngRequestTxParams(config.rewardRecipient);
  estimatedGasLimit = await getStartRngRequestEstimatedGasLimit(
    rngAuctionContracts.rngAuctionContract,
    startRngRequestTxParams,
  );

  populatedTx = await rngAuctionContracts.rngAuctionContract.populateTransaction.startRngRequest(
    ...Object.values(startRngRequestTxParams),
  );

  // This was a previous tx gas usage on Goerli + buffer room
  // estimatedGasLimit = BigNumber.from(330000);

  const gasCostUsd = await getGasCostUsd(
    estimatedGasLimit,
    config.chainId,
    provider,
    context.nativeTokenMarketRateUsd,
    populatedTx,
  );

  return gasCostUsd;
};

const getRelayTxParams = async (
  config: DrawAuctionConfig,
  contracts: RngAuctionContracts,
): Promise<RngAuctionRelayerDirectRelayTxParams> => {
  let txParams: RngAuctionRelayerDirectRelayTxParams;
  txParams = buildRngAuctionRelayerDirectRelayTxParams(
    contracts.rngRelayAuctionContract.address,
    config.rewardRecipient,
  );

  return txParams;
};

const buildStartRngRequestTxParams = (rewardRecipient: string): StartRngRequestTxParams => {
  return {
    rewardRecipient,
  };
};

const buildRngAuctionRelayerDirectRelayTxParams = (
  rngAuctionRelayListenerAddress: string,
  rewardRecipient: string,
): RngAuctionRelayerDirectRelayTxParams => {
  return {
    rngAuctionRelayListenerAddress,
    rewardRecipient,
  };
};

const getRelayGasCost = async (
  txParams: RngAuctionRelayerDirectRelayTxParams,
  contract: Contract,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
): Promise<number> => {
  console.log(chalk.blue(`Estimating relay gas costs ...`));
  printSpacer();

  const { chainId, provider } = config;
  const { nativeTokenMarketRateUsd } = context;

  let estimatedGasLimit: BigNumber;
  let populatedTx: PopulatedTransaction;
  if (context.drawAuctionState === DrawAuctionState.Relay) {
    // The relay uses 156,000~ gas, set to 200k just in case
    estimatedGasLimit = BigNumber.from(400000);
    // estimatedGasLimit = await getEstimatedGasLimitOptimismRelayTx(txParams, contract);
    populatedTx = await populateRelayTx(txParams, contract);
  } else {
    // TODO: Fill this in if/when we have a need for RelayerDirect (where the PrizePool
    // exists on same chain as RNG service)
  }

  const gasCostUsd = await getGasCostUsd(
    estimatedGasLimit,
    chainId,
    provider,
    nativeTokenMarketRateUsd,
    populatedTx,
  );

  return gasCostUsd;
};

const getGasCostUsd = async (
  estimatedGasLimit,
  chainId,
  provider,
  nativeTokenMarketRateUsd,
  populatedTx,
): Promise<number> => {
  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellow('Estimated gas limit is 0 ...'));
    return 0;
  } else {
    logBigNumber(
      'Estimated gas limit (wei):',
      estimatedGasLimit,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
    );
  }

  const { gasPrice } = await getGasPrice(provider);
  logBigNumber(
    'Recent Gas Price (wei):',
    gasPrice,
    NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );
  logStringValue('Recent Gas Price (gwei):', `${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);

  // 3. Convert gas costs to USD
  printSpacer();
  const { avgFeeUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    nativeTokenMarketRateUsd,
    provider,
    populatedTx.data,
  );
  console.log(
    chalk.grey(`Gas Cost (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(avgFeeUsd)}`),
    chalk.dim(`$${avgFeeUsd}`),
  );

  return avgFeeUsd;
};

const sendRelayTransaction = async (
  chainId: number,
  rngWallet: Wallet,
  rngOzRelayer: Relayer,
  txParams: RngAuctionRelayerDirectRelayTxParams,
  contract: Contract,
  config: DrawAuctionConfig,
) => {
  const { gasPrice } = await getGasPrice(config.provider);

  console.log(chalk.green(`Execute RngAuctionRelayerDirect#relay`));
  console.log(chalk.greenBright.bold(`Sending ...`));
  printSpacer();

  const populatedTx = await contract.populateTransaction.relay(...Object.values(txParams));

  const gasLimit = 400000;
  const tx = await sendPopulatedTx(
    chainId,
    rngOzRelayer,
    rngWallet,
    populatedTx,
    gasLimit,
    gasPrice,
    false,
    txParams,
  );

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
  printSpacer();
  printNote();

  return tx;
};

const increaseRngFeeAllowance = async (
  signer: DefenderRelaySigner | Signer,
  rngRelayerAddress: string,
  context: DrawAuctionContext,
  rngAuctionContracts: RngAuctionContracts,
) => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`Checking allowance ...`));

  // Increase allowance if necessary - so the RNG Auction contract can spend the bot's RNG Fee Token
  await approve(signer, rngRelayerAddress, rngAuctionContracts, context);
};

/**
 * Allowance - Give permission to the RngAuctionHelper contract to spend our Relayer/Bot's
 * RNG Fee Token (likely LINK). We will set allowance to max as we trust the security of the
 * RngAuctionHelper contract (you may want to change this!)
 * @returns {undefined} - void function
 */
const approve = async (
  signer: DefenderRelaySigner | Signer,
  rngRelayerAddress: string,
  rngAuctionContracts: RngAuctionContracts,
  context: DrawAuctionContext,
) => {
  try {
    const rngFeeTokenContract = new ethers.Contract(context.rngFeeToken.address, ERC20Abi, signer);

    const allowance = context.rngRelayer.rngFeeTokenAllowance;

    if (allowance.lt(context.rngFeeAmount)) {
      // Use the RngAuctionHelper if this is Chainlink VRFV2
      console.log(
        chalk.yellowBright(
          `Increasing RNG L1 relayer '${rngRelayerAddress}' ${context.rngFeeToken.symbol} allowance for the ChainlinkVRFV2DirectRngAuctionHelper to maximum ...`,
        ),
      );

      const tx = await rngFeeTokenContract.approve(
        rngAuctionContracts.rngAuctionContract.address,
        ethers.constants.MaxInt256,
      );
      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
      await tx.wait();

      const newAllowanceResult = await rngFeeTokenContract.allowance(
        rngRelayerAddress,
        rngAuctionContracts.rngAuctionContract.address,
      );
      logStringValue('New allowance:', newAllowanceResult.toString());
    } else {
      console.log(chalk.green('Sufficient allowance ✔'));
    }
  } catch (error) {
    console.log(chalk.red('error: ', error));
  }
  printSpacer();
};

const checkOrX = (bool: boolean): string => {
  return bool ? '✔' : '✗';
};

const populateRelayTx = async (txParams, contract) => {
  return await contract.populateTransaction.relay(...Object.values(txParams));
};
