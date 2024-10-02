import chalk from 'chalk';
import { ethers, BigNumber, Contract, PopulatedTransaction } from 'ethers';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';

import { DrawAuctionContracts, DrawAuctionContext, DrawAuctionConfig } from './types';
import {
  chainName,
  printDateTimeStr,
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  roundTwoDecimalPlaces,
  checkOrX,
  findRecipient,
} from './utils/index.js';
import { NETWORK_NATIVE_TOKEN_INFO } from './constants/index.js';
import {
  getDrawAuctionContextMulticall,
  DrawAuctionState,
} from './utils/getDrawAuctionContextMulticall.js';
import { sendPopulatedTx } from './helpers/sendPopulatedTx.js';

type RngBlockhashStartDrawTxParams = {
  drawManagerAddress: string;
  rewardRecipient: string;
};

type RngWitnetStartDrawTxParams = {
  rngPaymentAmount: BigNumber;
  drawManagerAddress: string;
  rewardRecipient: string;
  value: BigNumber;
};

type FinishDrawTxParams = {
  rewardRecipient: string;
};

type StartDrawTransformedTxParams = {
  transformedTxParams: object;
  value: BigNumber;
};

const DRAW_GAS_LIMIT_BUFFER: number = 100000 as const;
const DRAW_AUCTION_GAS_LIMIT: number = 1200000 as const;

/**
 * Main entry function - gets the current state of the DrawManager/RngWitnet
 * contracts and runs transactions if it's profitable.
 *
 * @returns {undefined} void function
 */
export async function runDrawAuction(
  contracts: ContractsBlob,
  config: DrawAuctionConfig,
): Promise<void> {
  const { chainId } = config;
  printSpacer();
  printDateTimeStr('START');
  printSpacer();

  const rewardRecipient = findRecipient(config);

  console.log(
    chalk.dim('Config - MIN_PROFIT_THRESHOLD_USD:'),
    chalk.yellowBright(config.minProfitThresholdUsd),
  );
  console.log(
    chalk.dim('Config - ERROR_STATE_MAX_GAS_COST_THRESHOLD_USD:'),
    chalk.yellowBright(config.errorStateMaxGasCostThresholdUsd),
  );

  const drawAuctionContracts = instantiateDrawAuctionContracts(config, contracts);

  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    config,
    drawAuctionContracts,
  );
  printContext(chainId, context);
  printSpacer();
  printSpacer();

  if (!context.drawAuctionState) {
    printAsterisks();
    console.log(chalk.yellowBright(`Currently no draw auctions to start or finish. Exiting ...`));
    printSpacer();
    return;
  }

  if (
    context.drawAuctionState === DrawAuctionState.Start ||
    context.drawAuctionState === DrawAuctionState.Error
  ) {
    console.log(chalk.greenBright(`Processing 'Start Draw' for ${chainName(chainId)}:`));
    await checkStartDraw(config, context, drawAuctionContracts, rewardRecipient);
  } else if (context.drawAuctionState === DrawAuctionState.Finish) {
    console.log(chalk.greenBright(`Processing 'Finish Draw' for ${chainName(chainId)}:`));
    await checkFinishDraw(config, context, drawAuctionContracts, rewardRecipient);
  }

  printSpacer();
  printDateTimeStr('END');
  printSpacer();
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

  let rngWitnetContract, rngBlockhashContract;
  try {
    rngWitnetContract = getContract('RngWitnet', chainId, provider, contracts, version);
  } catch (e) {
    console.warn(chalk.yellowBright('Unable to find RngWitnet contract. Likely uses RngBlockhash'));
  }
  try {
    rngBlockhashContract = getContract('RngBlockhash', chainId, provider, contracts, version);
  } catch (e) {
    console.warn(chalk.yellowBright('Unable to find RngBlockhash contract. Likely uses RngWitnet'));
  }

  logTable({
    prizePoolContract: prizePoolContract.address,
    drawManagerContract: drawManagerContract.address,
    rngWitnetContract: rngWitnetContract?.address,
    rngBlockhashContract: rngBlockhashContract?.address,
  });

  return {
    prizePoolContract,
    drawManagerContract,
    rngWitnetContract,
    rngBlockhashContract,
  };
};

/**
 * Compares (gas cost + rng fee cost) against rewards profit estimation for the RngWitnet#startDraw() function.
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 * @param {DrawAuctionContracts} drawAuctionContracts, ethers.js Contract instances of all rng auction contracts
 *
 * @returns {undefined} void function
 */
const checkStartDraw = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
  rewardRecipient: string,
) => {
  const gasCostUsd = await getStartDrawGasCostUsd(
    config,
    context,
    drawAuctionContracts,
    rewardRecipient,
  );
  if (gasCostUsd === 0) {
    printAsterisks();
    console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
    return;
  }

  const profitable = await calculateStartDrawProfit(config, context, gasCostUsd);

  let sendTransaction;
  console.log('context.drawAuctionState');
  console.log(context.drawAuctionState);
  if (context.drawAuctionState === DrawAuctionState.Error) {
    printErrorNote();

    // This will submit a transaction for a new random number in the case of Witnet's failed RNG state
    if (gasCostUsd < config.errorStateMaxGasCostThresholdUsd) {
      console.log(chalk.yellowBright('Cost within threshold, sending tx for new random number!'));
      // sendTransaction = true;
    } else {
      console.log(
        chalk.yellowBright('Cost above error state re-submit threshold, ignoring for now ...'),
      );
    }
  } else if (profitable) {
    // sendTransaction = true;
  } else {
    console.log(
      chalk.yellowBright(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }

  if (sendTransaction) {
    await sendPopulatedStartDrawTransaction(config, context, drawAuctionContracts, rewardRecipient);
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
  rewardRecipient: string,
) => {
  const { wallet, provider } = config;

  console.log(chalk.yellowBright(`Start Draw Transaction:`));
  console.log(chalk.greenBright(`Execute rngWitnet#startDraw`));
  printSpacer();

  let txParams;
  let populatedTx: PopulatedTransaction;
  let estimatedGasLimit: BigNumber;
  if (drawAuctionContracts.rngWitnetContract) {
    const contract: Contract = drawAuctionContracts.rngWitnetContract;
    txParams = buildRngWitnetStartDrawTxParams(context, drawAuctionContracts, rewardRecipient);

    // Witnet contracts on Optimism Mainnet do not work if you attempt to use estimate gas - You will
    // get back 'too much reward' revert errors from the WitnetOracleV2 contract
    estimatedGasLimit = BigNumber.from(DRAW_AUCTION_GAS_LIMIT);

    const { value, transformedTxParams }: StartDrawTransformedTxParams =
      transformRngWitnetStartDrawTxParams(txParams);

    populatedTx = await contract.populateTransaction.startDraw(
      ...Object.values(transformedTxParams),
      { value },
    );
  } else {
    const contract: Contract = drawAuctionContracts.rngBlockhashContract;
    txParams = buildRngBlockhashStartDrawTxParams(drawAuctionContracts, rewardRecipient);
    estimatedGasLimit = await getRngBlockhashStartDrawEstimatedGasLimit(contract, txParams);
    populatedTx = await contract.populateTransaction.startDraw(...Object.values(txParams));
  }

  const estimatedGasLimitWithBufferAsNumber: number = Number(estimatedGasLimit) + 100000;
  console.log(chalk.greenBright.bold(`Sending ...`));

  const tx = await sendPopulatedTx(
    provider,
    wallet,
    populatedTx,
    estimatedGasLimitWithBufferAsNumber,
    txParams,
  );

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
  printSpacer();

  // We don't receive a reward for re-submitting for a new random number in the case of a Witnet failure
  if (context.drawAuctionState !== DrawAuctionState.Error) {
    printNote();
  }
};

/**
 * Runs the gas cost vs. rewards profit estimation for the DrawManager#finishDraw() function.
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 * @param {DrawAuctionContracts} drawAuctionContracts, ethers.js Contract instances of all rng auction contracts
 *
 * @returns {undefined} void function
 */
const checkFinishDraw = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
  rewardRecipient: string,
) => {
  const contract: Contract = drawAuctionContracts.drawManagerContract;

  const txParams = buildFinishDrawTxParams(rewardRecipient);

  const gasCostUsd = await getFinishDrawGasCostUsd(txParams, contract, config, context);
  if (gasCostUsd === 0) {
    printAsterisks();
    console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
    return;
  }

  const { netProfitUsd, profitable } = await calculateFinishDrawProfit(
    config,
    context.finishDrawRewardUsd,
    gasCostUsd,
  );

  if (profitable) {
    await sendPopulatedFinishDrawTransaction(config, txParams, contract);
  } else {
    console.log(
      chalk.yellowBright(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }
};

/**
 * Figures out how much gas is required to run the RngWitnet#startDraw() payable function
 *
 * @returns {Promise<BigNumber>} Promise object of the gas limit in wei as a BigNumber
 */
const getRngWitnetStartDrawEstimatedGasLimit = async (
  contract: Contract,
  rngWitnetStartDrawTxParams: RngWitnetStartDrawTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    const { value, transformedTxParams }: StartDrawTransformedTxParams =
      transformRngWitnetStartDrawTxParams(rngWitnetStartDrawTxParams);

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
 * Figures out how much gas is required to run the DrawManager#startDraw() payable function
 *
 * @returns {Promise<BigNumber>} Promise object of the gas limit in wei as a BigNumber
 */
const getRngBlockhashStartDrawEstimatedGasLimit = async (
  contract: Contract,
  rngBlockhashStartDrawTxParams: RngBlockhashStartDrawTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await contract.estimateGas.startDraw(
      ...Object.values(rngBlockhashStartDrawTxParams),
    );
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
};

/**
 * Figures out how much gas is required to run the RngWitnet#finishDraw() function
 *
 * @returns {Promise<BigNumber>} Promise object of the gas limit in wei as a BigNumber
 */
const getFinishDrawEstimatedGasLimit = async (
  contract: Contract,
  finishDrawTxParams: FinishDrawTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await contract.estimateGas.finishDraw(...Object.values(finishDrawTxParams));
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
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 * @param {number} gasCostUsd USD Value of how much gas it will cost to run startDraw()
 *
 * @returns {Promise<boolean>} Promise object with boolean of profitable or not
 */
const calculateStartDrawProfit = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  gasCostUsd: number,
): Promise<boolean> => {
  printAsterisks();
  printSpacer();
  printSpacer();
  console.log(chalk.blueBright(`Calculating profit ...`));
  console.log(chalk.magenta('Profit/Loss (USD):'));
  printSpacer();

  const grossProfitUsd = context.startDrawRewardUsd;
  console.log(chalk.magenta('Gross Profit = Reward'));

  const netProfitUsd = grossProfitUsd - gasCostUsd - context.rngFeeEstimateUsd;
  console.log(chalk.magenta('Net profit = (Gross Profit - Gas Fees [Max] - RNG Fee)'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        grossProfitUsd,
      )} - $${roundTwoDecimalPlaces(gasCostUsd)} - $${roundTwoDecimalPlaces(
        context.rngFeeEstimateUsd,
      )})`,
    ),
    chalk.dim(
      `$${netProfitUsd} = ($${grossProfitUsd} - $${gasCostUsd} - $${context.rngFeeEstimateUsd})`,
    ),
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
 * Determines if the DrawManager#finishDraw() transaction will be profitable.
 *
 * Takes into account the cost of gas for the DrawManager#finishDraw(),
 * and the rewards earned.
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 * @param {number} gasCostUsd USD Value of how much gas it will cost to run finishDraw()
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateFinishDrawProfit = async (
  config: DrawAuctionConfig,
  rewardUsd: number,
  gasCostUsd: number,
): Promise<{ netProfitUsd: number; profitable: boolean }> => {
  printSpacer();
  printSpacer();
  console.log(chalk.blueBright(`Calculating profit ...`));

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
 * Logs the context (state of the contracts) to the console.
 *
 * @param {number} chainId, the chain ID we're operating on
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 *
 * @returns {undefined} void function
 */
const printContext = (chainId: number, context: DrawAuctionContext) => {
  printAsterisks();

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`Prize Pool:`));
  printSpacer();
  logStringValue('Draw ID:', context.drawId);

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`Tokens:`));
  printSpacer();
  logStringValue(
    `1a. Chain Native/Gas Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${context.nativeTokenMarketRateUsd}`,
  );
  logStringValue(
    `1b. Reward Token '${context.rewardToken.symbol}' Market Rate (USD):`,
    `$${context.rewardToken.assetRateUsd}`,
  );

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`Rng Auction State:`));

  printSpacer();
  logStringValue(`2a. Can Start Draw? `, `${checkOrX(context.canStartDraw)}`);

  logStringValue(
    `2b. Start Draw Expected Reward:`,
    `${ethers.utils.formatUnits(context.startDrawReward, context.rewardToken.decimals)} ${
      context.rewardToken.symbol
    }`,
  );
  console.log(
    chalk.grey(`2c. Start Draw Expected Reward (USD):`),
    chalk.yellowBright(`$${roundTwoDecimalPlaces(context.startDrawRewardUsd)}`),
    chalk.dim(`$${context.startDrawRewardUsd}`),
  );
  logStringValue(
    `2d. PrizePool (${chainName(chainId)}) can start draw in:`,
    `${(context.prizePoolDrawClosesAt - Math.ceil(Date.now() / 1000)) / 60} minutes`,
  );

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`Finish Draw Auction State:`));
  printSpacer();
  logStringValue(`3a. Can Finish Draw? `, `${checkOrX(context.canFinishDraw)}`);

  logStringValue(
    `3b. Finish Draw Expected Reward:`,
    `${ethers.utils.formatUnits(context.finishDrawReward, context.rewardToken.decimals)} ${
      context.rewardToken.symbol
    }`,
  );
  console.log(
    chalk.grey(`3c. Finish Draw Expected Reward (USD):`),
    chalk.yellowBright(`$${roundTwoDecimalPlaces(context.finishDrawRewardUsd)}`),
    chalk.dim(`$${context.finishDrawRewardUsd}`),
  );

  printSpacer();
};

/**
 * Finds how much the gas will cost (in $ USD) for the RngWitnet#startDraw transaction
 *
 * @param {RngWitnetStartDrawTxParams} txParams, the startDraw() transaction parameters object
 * @param {Contract} contract, ethers.js Contract instance of the RngWitnet contract
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 *
 * @returns {number} Gas cost (in $ USD) for the startDraw function
 */
const getStartDrawGasCostUsd = async (
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
  rewardRecipient: string,
): Promise<number> => {
  const { nativeTokenMarketRateUsd } = context;

  console.log(chalk.blueBright(`Estimating RngWitnet#startDraw() gas costs ...`));
  printSpacer();

  let txParams;
  let estimatedGasLimit: BigNumber = BigNumber.from(0);
  let populatedTx: PopulatedTransaction;
  if (drawAuctionContracts.rngWitnetContract) {
    const contract: Contract = drawAuctionContracts.rngWitnetContract;
    txParams = buildRngWitnetStartDrawTxParams(context, drawAuctionContracts, rewardRecipient);

    // Witnet contracts on Optimism Mainnet do not work if you attempt to use estimate gas - You will
    // get back 'too much reward' revert errors from the WitnetOracleV2 contract
    estimatedGasLimit = BigNumber.from(DRAW_AUCTION_GAS_LIMIT);

    const { value, transformedTxParams }: StartDrawTransformedTxParams =
      transformRngWitnetStartDrawTxParams(txParams);

    populatedTx = await contract.populateTransaction.startDraw(
      ...Object.values(transformedTxParams),
      { value },
    );
  } else {
    const contract: Contract = drawAuctionContracts.rngBlockhashContract;
    txParams = buildRngBlockhashStartDrawTxParams(drawAuctionContracts, rewardRecipient);
    estimatedGasLimit = await getRngBlockhashStartDrawEstimatedGasLimit(contract, txParams);
    populatedTx = await contract.populateTransaction.startDraw(...Object.values(txParams));
  }

  // Add extra buffer space on the estimate because estimates are typically too low and cause tx's to fail
  const estimatedGasLimitWithBuffer: BigNumber = estimatedGasLimit?.add(DRAW_GAS_LIMIT_BUFFER);

  const gasCostUsd = await getGasCostUsd(
    config,
    estimatedGasLimitWithBuffer,
    nativeTokenMarketRateUsd,
    populatedTx,
  );

  return gasCostUsd;
};

/**
 * Creates an object with all the transaction parameters for the RngBlockhash#startDraw() transaction.
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContracts} drawAuctionContracts, ethers.js Contract instances of all rng auction contracts
 *
 * @returns {RngBlockhashStartDrawTxParams} The startDraw() tx parameters object
 */
const buildRngBlockhashStartDrawTxParams = (
  drawAuctionContracts: DrawAuctionContracts,
  rewardRecipient: string,
): RngBlockhashStartDrawTxParams => {
  return {
    drawManagerAddress: drawAuctionContracts.drawManagerContract.address,
    rewardRecipient,
  };
};

/**
 * Creates an object with all the transaction parameters for the RngWitnet#startDraw() transaction.
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 * @param {DrawAuctionContracts} drawAuctionContracts, ethers.js Contract instances of all rng auction contracts
 *
 * @returns {RngWitnetStartDrawTxParams} The startDraw() tx parameters object
 */
const buildRngWitnetStartDrawTxParams = (
  context: DrawAuctionContext,
  drawAuctionContracts: DrawAuctionContracts,
  rewardRecipient: string,
): RngWitnetStartDrawTxParams => {
  return {
    rngPaymentAmount: context.rngFeeEstimate,
    drawManagerAddress: drawAuctionContracts.drawManagerContract.address,
    rewardRecipient,
    value: context.rngFeeEstimate,
  };
};

/**
 * Creates an object with all the transaction parameters for the DrawManager#finishDraw() transaction.
 *
 * @param {DrawAuctionConfig} config, draw auction config
 *
 * @returns {FinishDrawTxParams} The finishDraw() tx parameters object
 */
const buildFinishDrawTxParams = (rewardRecipient: string): FinishDrawTxParams => {
  return {
    rewardRecipient,
  };
};

/**
 * Finds how much the gas will cost (in $ USD) for the DrawManager#finishDraw transaction
 *
 * @param {FinishDrawTxParams} txParams, the finishDraw() transaction parameters object
 * @param {Contract} contract, ethers.js Contract instance of the DrawManager contract
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 *
 * @returns {FinishDrawTxParams} The finishDraw() tx parameters object
 */
const getFinishDrawGasCostUsd = async (
  txParams: FinishDrawTxParams,
  contract: Contract,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
): Promise<number> => {
  console.log(chalk.blueBright(`Estimating DrawManager#finishDraw() gas costs ...`));
  printSpacer();

  const { nativeTokenMarketRateUsd } = context;

  const estimatedGasLimit: BigNumber = await getFinishDrawEstimatedGasLimit(contract, txParams);

  const populatedTx: PopulatedTransaction = await contract.populateTransaction.finishDraw(
    ...Object.values(txParams),
  );

  // Add extra buffer space on the estimate because estimates are typically too low and cause tx's to fail
  const estimatedGasLimitWithBuffer: BigNumber = estimatedGasLimit.add(DRAW_GAS_LIMIT_BUFFER);

  const gasCostUsd = await getGasCostUsd(
    config,
    estimatedGasLimitWithBuffer,
    nativeTokenMarketRateUsd,
    populatedTx,
  );

  return gasCostUsd;
};

/**
 * Finds how much a transaction will cost (gas costs in $ USD) for the a generic contract tx function
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {BigNumber} estimatedGasLimit, BigNumber of a gas limit provided by ether.js estimateGas functions
 * @param {number} context, the current price (in $ USD) of the native (gas) token for this network
 * @param {populatedTx} PopulatedTransaction, the already-built object with transaction data, from, to, etc
 *
 * @returns {number} Amount gas will cost (in $ USD)
 */
const getGasCostUsd = async (
  config: DrawAuctionConfig,
  estimatedGasLimit: BigNumber,
  nativeTokenMarketRateUsd: number,
  populatedTx: PopulatedTransaction,
): Promise<number> => {
  const { chainId, provider } = config;

  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellowBright('Estimated gas limit is 0 ...'));
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
    chalk.yellowBright(`$${roundTwoDecimalPlaces(avgFeeUsd)}`),
    chalk.dim(`$${avgFeeUsd}`),
  );

  return avgFeeUsd;
};

/**
 * Fires off the DrawManager#finishDraw() transaction.
 *
 * @param {DrawAuctionConfig} config, draw auction config
 * @param {FinishDrawTxParams} txParams, transaction parameters
 * @param {Contract} contract, ethers.js Contract instance of the DrawManager contract
 */
const sendPopulatedFinishDrawTransaction = async (
  config: DrawAuctionConfig,
  txParams: FinishDrawTxParams,
  contract: Contract,
) => {
  const { wallet, provider } = config;

  const estimatedGasLimit: BigNumber = await getFinishDrawEstimatedGasLimit(contract, txParams);
  const estimatedGasLimitWithBufferAsNumber: number =
    Number(estimatedGasLimit) + DRAW_GAS_LIMIT_BUFFER;

  console.log(chalk.greenBright(`Execute DrawManager#finishDraw`));
  console.log(chalk.greenBright.bold(`Sending ...`));
  printSpacer();

  const populatedTx = await contract.populateTransaction.finishDraw(...Object.values(txParams));

  const tx = await sendPopulatedTx(
    provider,
    wallet,
    populatedTx,
    estimatedGasLimitWithBufferAsNumber,
    txParams,
  );

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
  printSpacer();
  printNote();
};

/**
 * Takes the current RngWitnetStartDrawTxParams transaction params and breaks off the 'value' param into it's own variable,
 * then returns a modified version of the original transaction params without the 'value' param.
 *
 * @param {RngWitnetStartDrawTxParams} txParams
 *
 * @returns {StartDrawTransformedTxParams}
 */
const transformRngWitnetStartDrawTxParams = (
  txParams: RngWitnetStartDrawTxParams,
): StartDrawTransformedTxParams => {
  const transformedTxParams = { ...txParams };

  const value = transformedTxParams.value;
  delete transformedTxParams.value;

  return { value, transformedTxParams };
};

/**
 * A note telling the bot maintainer where they can claim the rewards they earn.
 */
const printNote = () => {
  console.log(chalk.yellowBright('|*******************************************************|'));
  console.log(chalk.yellowBright('|                                                       |'));
  console.log(chalk.yellowBright('|    Rewards accumulate post-draw on the PrizePool!     |'));
  console.log(chalk.yellowBright('|  Withdraw your rewards manually from that contract.   |'));
  console.log(chalk.yellowBright('|                                                       |'));
  console.log(chalk.yellowBright('|*******************************************************|'));
};

/**
 * Logs for the bot maintainer to know we were in the error state
 */
const printErrorNote = () => {
  console.log(chalk.yellowBright('|*******************************************************|'));
  console.log(chalk.yellowBright('|                                                       |'));
  console.log(chalk.yellowBright('|    Witnet random number request returned an error!    |'));
  console.log(chalk.yellowBright('|                                                       |'));
  console.log(chalk.yellowBright('|*******************************************************|'));
};
