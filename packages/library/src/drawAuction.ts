import { ethers, BigNumber, Contract, PopulatedTransaction, Wallet, Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract, getContracts } from '@generationsoftware/pt-v5-utils-js';
import { Relayer } from 'defender-relay-client';
import chalk from 'chalk';

import { DrawAuctionContracts, DrawAuctionContext, DrawAuctionConfig } from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  roundTwoDecimalPlaces,
} from './utils';
import { chainName } from './utils/network';
import { NETWORK_NATIVE_TOKEN_INFO } from './constants/network';
import {
  getDrawAuctionContextMulticall,
  DrawAuctionState,
} from './utils/getDrawAuctionContextMulticall';
import { sendPopulatedTx } from './helpers/sendPopulatedTx';

type StartDrawTxParams = {
  drawManagerAddress: string;
  rewardRecipient: string;
  value: BigNumber;
};

type AwardDrawTxParams = {
  rewardRecipient: string;
};

type StartDrawTransformedTxParams = {
  transformedTxParams: object;
  value: BigNumber;
};

// const MAX_FORCE_RELAY_LOSS_THRESHOLD_USD = -25;

/**
 * Figures out the current state of the DrawManager/RngWitnet contracts and if it's profitable
 * to run any of the transactions it will populate and return the tx objects
 *
 * @returns {undefined} void function
 */
export async function runDrawAuction(
  contracts: ContractsBlob,
  config: DrawAuctionConfig,
): Promise<void> {
  const { chainId } = config;

  const drawAuctionContracts = instantiateDrawAuctionContracts(config, contracts);

  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    config,
    drawAuctionContracts,
  );
  printContext(chainId, context);

  if (!context.drawAuctionState) {
    printAsterisks();
    console.log(chalk.yellow(`Currently no Rng or RngRelay auctions to complete. Exiting ...`));
    printSpacer();
    return;
  }

  if (context.drawAuctionState === DrawAuctionState.Start) {
    console.log(chalk.yellow(`Processing 'start draw' for ${chainName(chainId)}:`));
    await checkStartDraw(config, context, drawAuctionContracts);
  } else if (context.drawAuctionState === DrawAuctionState.Award) {
    console.log(chalk.yellow(`Processing 'award draw' for ${chainName(chainId)}:`));
    await checkAwardDraw(config, context, drawAuctionContracts);
  }
}

/**
 * Pulls the contract data (abi, address, etc.) from the passed in ContractsBlob and instantiates
 * the contracts using ethers.js.
 *
 * @returns {DrawAuctionContracts} object representing the contracts we need to interact with for RNG draw auctions
 */
const instantiateDrawAuctionContracts = (
  config: DrawAuctionConfig,
  contracts: ContractsBlob,
): DrawAuctionContracts => {
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
  const drawManagerContract = getContract('DrawManager', chainId, provider, contracts, version);
  const rngWitnetContract = getContract('RngWitnet', chainId, provider, contracts, version);

  logTable({
    prizePoolContract: prizePoolContract.address,
    drawManagerContract: drawManagerContract.address,
    rngWitnetContract: rngWitnetContract.address,
  });

  return {
    prizePoolContract,
    drawManagerContract,
    rngWitnetContract,
  };
};

/**
 * Runs the (gas cost + rng fee cost) vs. rewards profit estimation for the RngWitnet#startDraw() function.
 *
 * @returns {undefined} void function
 */
const checkStartDraw = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
) => {
  const rewardUsd = context.startDrawFeeUsd;

  const gasCostUsd = await getStartDrawGasCost(config, context, drawAuctionContracts);
  console.log('gasCostUsd');
  console.log(gasCostUsd);
  if (gasCostUsd === 0) {
    printAsterisks();
    console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
    return;
  }

  const profitable = await calculateStartDrawProfit(config, context, rewardUsd, gasCostUsd);

  if (profitable) {
    await sendPopulatedStartDrawTransaction(config, context, drawAuctionContracts);
  } else {
    console.log(
      chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }
};

/**
 * Begins sending the RngWitnet#startDraw() payable function.
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 * @param {DrawAuctionContracts} drawAuctionContracts, ethers.js Contract instances of all rng auction contracts
 *
 * @returns {undefined} void function
 */
const sendPopulatedStartDrawTransaction = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
) => {
  const { chainId, ozRelayer, wallet, provider } = config;

  console.log(chalk.yellow(`Start Draw Transaction:`));
  console.log(chalk.green(`Execute rngWitnet#startDraw`));
  printSpacer();

  const contract: Contract = drawAuctionContracts.rngWitnetContract;
  const txParams: StartDrawTxParams = buildStartDrawTxParams(config, context, drawAuctionContracts);
  console.log('txParams');
  console.log(txParams);

  const { value, transformedTxParams }: StartDrawTransformedTxParams =
    transformStartDrawTxParams(txParams);

  const populatedTx: PopulatedTransaction = await contract.populateTransaction.startDraw(
    ...Object.values(transformedTxParams),
    { value },
  );
  console.log('populatedTx');
  console.log(populatedTx);

  const gasPrice = await provider.getGasPrice();
  console.log(chalk.greenBright.bold(`Sending ...`));
  console.log('gasPrice');
  console.log(gasPrice);
  // const gasPrice = BigNumber.from(100000000);

  const gasLimit = 850000;
  // const tx = await sendPopulatedTx(
  //   chainId,
  //   ozRelayer,
  //   wallet,
  //   populatedTx,
  //   gasLimit,
  //   gasPrice,
  //   config.useFlashbots,
  //   txParams,
  // );

  // console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  // console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
  printSpacer();
  printNote();
};

/**
 * Runs the gas cost vs. rewards profit estimation for the DrawManager#awardDraw() function.
 *
 * @returns {undefined} void function
 */
const checkAwardDraw = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
) => {
  const { chainId, wallet, ozRelayer } = config;

  const contract = drawAuctionContracts.drawManagerContract;

  const txParams = buildAwardDrawTxParams(config.rewardRecipient);

  const gasCostUsd = await getAwardDrawGasCost(txParams, contract, config, context);
  if (gasCostUsd === 0) {
    printAsterisks();
    console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
    return;
  }

  const { netProfitUsd, profitable } = await calculateAwardDrawProfit(
    config,
    context.awardDrawFeeUsd,
    gasCostUsd,
  );
  console.log('profitable');
  console.log(profitable);

  // const forceRelay = calculateForceRelay(config, context, netProfitUsd);
  // console.log('forceRelay');
  // console.log(forceRelay);

  // #5. Send transaction
  // if (profitable || forceRelay) {
  if (profitable) {
    await sendPopulatedAwardDrawTransaction(config, txParams, contract);
  } else {
    console.log(
      chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }
};

/**
 * Figures out how much gas is required to run the RngWitnet#startDraw() payable function
 *
 * @returns {Promise<BigNumber>} Promise object of the gas limit in wei as a BigNumber
 */
const getStartDrawEstimatedGasLimit = async (
  contract: Contract,
  startDrawTxParams: StartDrawTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    const { value, transformedTxParams }: StartDrawTransformedTxParams =
      transformStartDrawTxParams(startDrawTxParams);

    estimatedGasLimit = await contract.estimateGas.startDraw(
      ...Object.values(transformedTxParams),
      {
        value,
      },
    );
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
};

/**
 * Determines if the RngWitnet#startDraw() transaction will be profitable.
 *
 * Takes into account the cost of gas, the cost of the RNG fee to Witnet,
 * and the rewards we will earn.
 *
 * @returns {Promise<boolean>} Promise object with boolean of profitable or not
 */
const calculateStartDrawProfit = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  rewardUsd: number,
  gasCostUsd: number,
): Promise<boolean> => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`Calculating profit ...`));

  printSpacer();
  console.log(chalk.magenta('Profit/Loss (USD):'));
  printSpacer();

  const grossProfitUsd = rewardUsd;
  console.log(chalk.magenta('Gross Profit = Reward'));

  const netProfitUsd = grossProfitUsd - gasCostUsd - context.startDrawFeeUsd;
  console.log(chalk.magenta('Net profit = (Gross Profit - Gas Fees [Max] - RNG Fee)'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        rewardUsd,
      )} - $${roundTwoDecimalPlaces(gasCostUsd)} - $${roundTwoDecimalPlaces(
        context.startDrawFeeUsd,
      )})`,
    ),
    chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${gasCostUsd} - $${context.startDrawFeeUsd})`),
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
 * Determines if the DrawManager#awardDraw() transaction will be profitable.
 *
 * Takes into account the cost of gas for the DrawManager#awardDraw(),
 * and the rewards earned.
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateAwardDrawProfit = async (
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
 * Logs the context to the console.
 *
 * @returns {undefined} void function
 */
const printContext = (chainId: number, context: DrawAuctionContext) => {
  printAsterisks();
  printSpacer();
  console.log(chalk.blue.bold(`Tokens:`));

  printSpacer();
  logStringValue(
    `1a. Chain Native/Gas Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${context.nativeTokenMarketRateUsd}`,
  );

  printSpacer();
  logStringValue(
    `1b. Reward Token '${context.rewardToken.symbol}' Market Rate (USD):`,
    `$${context.rewardToken.assetRateUsd}`,
  );

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`Rng Auction State:`));

  printSpacer();
  logStringValue(`2a. Can Start Draw? `, `${checkOrX(context.canStartDraw)}`);

  if (context.canStartDraw) {
    printSpacer();
    logStringValue(
      `2b. Start Draw ${chainName(chainId)} Expected Reward:`,
      `${context.startDrawFee.toString()} ${context.rewardToken.symbol}`,
    );
    console.log(
      chalk.grey(`2c. Start Draw ${chainName(chainId)} Expected Reward (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(context.startDrawFeeUsd)}`),
      chalk.dim(`$${context.startDrawFeeUsd}`),
    );
  } else {
    printSpacer();

    logStringValue(
      `${chainName(chainId)} PrizePool can start draw in:`,
      `${(context.prizePoolDrawClosesAt - Math.ceil(Date.now() / 1000)) / 60} minutes`,
    );
    printSpacer();
  }

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`Award Draw Auction State:`));

  logStringValue(`3a. Can Award Draw? `, `${checkOrX(context.canAwardDraw)}`);
  if (context.canAwardDraw) {
    logBigNumber(
      `3b. Award Draw Expected Reward:`,
      context.awardDrawFee.toString(),
      context.rewardToken.decimals,
      context.rewardToken.symbol,
    );
    console.log(
      chalk.grey(`3c. Award Draw Expected Reward (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(context.awardDrawFeeUsd)}`),
      chalk.dim(`$${context.awardDrawFeeUsd}`),
    );
  }

  printSpacer();
};

/**
 *
 *
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const getStartDrawGasCost = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
): Promise<number> => {
  const { chainId, provider } = config;
  const { nativeTokenMarketRateUsd } = context;

  console.log(chalk.blue(`Estimating RngWitnet#startDraw() gas costs ...`));
  printSpacer();

  const startDrawTxParams = buildStartDrawTxParams(config, context, drawAuctionContracts);
  console.log('startDrawTxParams');
  console.log(startDrawTxParams);

  const estimatedGasLimit: BigNumber = await getStartDrawEstimatedGasLimit(
    drawAuctionContracts.rngWitnetContract,
    startDrawTxParams,
  );
  console.log('estimatedGasLimit');
  console.log(estimatedGasLimit);

  const { value, transformedTxParams }: StartDrawTransformedTxParams =
    transformStartDrawTxParams(startDrawTxParams);
  const populatedTx: PopulatedTransaction =
    await drawAuctionContracts.rngWitnetContract.populateTransaction.startDraw(
      ...Object.values(transformedTxParams),
      { value },
    );

  // hard-coded gas limit:
  // estimatedGasLimit = BigNumber.from(630000);
  const gasCostUsd = await getGasCostUsd(
    estimatedGasLimit,
    chainId,
    provider,
    nativeTokenMarketRateUsd,
    populatedTx,
  );

  return gasCostUsd;
};

const buildStartDrawTxParams = (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
): StartDrawTxParams => {
  return {
    drawManagerAddress: drawAuctionContracts.drawManagerContract.address,
    rewardRecipient: config.rewardRecipient,
    value: context.rngFeeEstimate.mul(2), //  double this since the estimate always comes back shy of enough
  };
};

const buildAwardDrawTxParams = (rewardRecipient: string): AwardDrawTxParams => {
  return {
    rewardRecipient,
  };
};

const getAwardDrawGasCost = async (
  txParams: AwardDrawTxParams,
  contract: Contract,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
): Promise<number> => {
  console.log(chalk.blue(`Estimating DrawManager#awardDraw() gas costs ...`));
  printSpacer();

  const { chainId, provider } = config;
  const { nativeTokenMarketRateUsd } = context;

  // The relay uses 156,000~ gas, set to 200k just in case
  const estimatedGasLimit: BigNumber = BigNumber.from(400000);
  const populatedTx: PopulatedTransaction = await contract.populateTransaction.awardDraw(
    ...Object.values(txParams),
  );

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

  const gasPrice = await provider.getGasPrice();
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

/**
 * Fires off the DrawManager#awardDraw() transaction
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {AwardDrawTxParams} txParams, transaction parameters
 * @param {Contract} contract, ethers.js Contract instance of the DrawManager contract
 *
 * @returns {StartDrawTransformedTxParams}
 */
const sendPopulatedAwardDrawTransaction = async (
  config: DrawAuctionConfig,
  txParams: AwardDrawTxParams,
  contract: Contract,
) => {
  const { chainId, wallet, ozRelayer, provider } = config;
  const gasPrice = await provider.getGasPrice();

  console.log(chalk.green(`Execute DrawManager#awardDraw`));
  console.log(chalk.greenBright.bold(`Sending ...`));
  printSpacer();

  const populatedTx = await contract.populateTransaction.awardDraw(...Object.values(txParams));

  const gasLimit = 800000;
  // const tx = await sendPopulatedTx(
  //   chainId,
  //   ozRelayer,
  //   wallet,
  //   populatedTx,
  //   gasLimit,
  //   gasPrice,
  //   false,
  //   txParams,
  // );

  // console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  // console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
  printSpacer();
  printNote();

  // return tx;
};

const checkOrX = (bool: boolean): string => {
  return bool ? '✔' : '✗';
};

/**
 * Takes the current StartDrawTxParams transaction params and breaks off the 'value' param into it's own variable,
 * then returns a modified version of the original transaction params without the 'value' param.
 *
 * @param {StartDrawTxParams} txParams
 *
 * @returns {StartDrawTransformedTxParams}
 */
const transformStartDrawTxParams = (txParams: StartDrawTxParams): StartDrawTransformedTxParams => {
  const transformedTxParams = { ...txParams };

  const value = transformedTxParams.value;
  delete transformedTxParams.value;

  return { value, transformedTxParams };
};

/**
 * A note telling the bot maintainer where they can claim the rewards they earn.
 */
const printNote = () => {
  console.log(chalk.yellow('|*******************************************************|'));
  console.log(chalk.yellow('|                                                       |'));
  console.log(chalk.yellow('|  Rewards accumulate post-awarding on the PrizePool!   |'));
  console.log(chalk.yellow('|  Withdraw your rewards manually from that contract.   |'));
  console.log(chalk.yellow('|                                                       |'));
  console.log(chalk.yellow('|*******************************************************|'));
};
