import { ethers, BigNumber, Contract, PopulatedTransaction, Wallet, Signer } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract, getContracts } from '@generationsoftware/pt-v5-utils-js';
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
import { NETWORK_NATIVE_TOKEN_INFO } from './constants/network';
import {
  getDrawAuctionContextMulticall,
  DrawAuctionState,
} from './utils/getDrawAuctionContextMulticall';
import { sendPopulatedTx } from './helpers/sendPopulatedTx';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

interface StartDrawTxParams {
  drawManagerAddress: string;
  rewardRecipient: string;
  value: string;
}

interface AwardDrawTxParams {
  rewardRecipient: string;
}

// const MAX_FORCE_RELAY_LOSS_THRESHOLD_USD = -25;

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
  const { chainId, provider, wallet, ozRelayer, relayerAddress, rewardRecipient, covalentApiKey } =
    config;

  const rngAuctionContracts = instantiateRngAuctionContracts(config, contracts);

  // #1. Get info about the prize pool prize/reserve token, auction states, etc.
  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    chainId,
    provider,
    rngAuctionContracts,
    relayerAddress,
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

  // #4. Calculate profit and send transactions when profitable
  let rewardUsd = 0;
  if (context.drawAuctionState === DrawAuctionState.Start) {
    rewardUsd = context.startDrawFeeUsd;

    // const gasCostUsd = -0.01;
    const gasCostUsd = await getRngGasCost(provider, rngAuctionContracts, config, context);
    console.log('gasCostUsd');
    console.log(gasCostUsd);
    if (gasCostUsd === 0) {
      printAsterisks();
      console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
      return;
    }

    const profitable = await calculateStartDrawProfit(config, rewardUsd, gasCostUsd, context);

    if (profitable) {
      await sendStartDrawTransaction(
        chainId,
        wallet,
        ozRelayer,
        provider,
        rngAuctionContracts,
        config,
        context,
      );
    } else {
      console.log(
        chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
      );
    }
  } else if (context.drawAuctionState === DrawAuctionState.Award) {
    console.log(chalk.yellow(`Processing 'award' for ${chainName(chainId)}:`));
    await sendAwardDrawTransaction(
      wallet,
      ozRelayer,
      rngAuctionContracts,
      config,
      context,
      contracts,
    );
  }
}

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

const transformTxParams = (txParams): { value: number; transformedTxParams: object } => {
  const transformedTxParams = { ...txParams };

  const value = transformedTxParams.value;
  delete transformedTxParams.value;

  return { value, transformedTxParams };
};

const sendStartDrawTransaction = async (
  chainId: number,
  wallet: Wallet,
  ozRelayer: Relayer,
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
) => {
  console.log(chalk.yellow(`Start Draw Transaction:`));
  console.log(chalk.green(`Execute rngWitnet#startDraw`));
  printSpacer();
  const contract = rngAuctionContracts.rngWitnetContract;

  const txParams = buildStartDrawTxParams(rngAuctionContracts, config, context);
  console.log('txParams');
  console.log(txParams);

  const { value, transformedTxParams } = transformTxParams(txParams);

  const populatedTx: PopulatedTransaction = await contract.populateTransaction.startDraw(
    ...Object.values(transformedTxParams),
    { value },
  );
  console.log('populatedTx');
  console.log(populatedTx);

  const { gasPrice } = await getGasPrice(provider);
  console.log(chalk.greenBright.bold(`Sending ...`));
  console.log('gasPrice');
  console.log(gasPrice);
  // const gasPrice = BigNumber.from(100000000);

  const gasLimit = 850000;
  const tx = await sendPopulatedTx(
    chainId,
    ozRelayer,
    wallet,
    populatedTx,
    gasLimit,
    gasPrice,
    config.useFlashbots,
    txParams,
  );

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
  printSpacer();
  printNote();
};

const sendAwardDrawTransaction = async (
  wallet: Wallet,
  ozRelayer: Relayer,
  rngAuctionContracts: RngAuctionContracts,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
  contracts: ContractsBlob,
) => {
  const { chainId, provider } = config;

  const contract = rngAuctionContracts.drawManagerContract;

  const txParams = buildAwardDrawTxParams(config.rewardRecipient);

  const gasCostUsd = await getAwardDrawGasCost(txParams, contract, config, context);
  if (gasCostUsd === 0) {
    printAsterisks();
    console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
    return;
  }

  // #4. Decide if profitable or not
  const { netProfitUsd, profitable } = await calculateAwardDrawProfit(
    config,
    context.awardDrawFeeUsd,
    gasCostUsd,
  );

  // const forceRelay = calculateForceRelay(config, context, netProfitUsd);
  // console.log('forceRelay');
  // console.log(forceRelay);

  // #5. Send transaction
  // if (profitable || forceRelay) {
  if (profitable) {
    await sendPopulatedAwardDrawTransaction(chainId, wallet, ozRelayer, txParams, contract, config);
  } else {
    console.log(
      chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }
};

const printNote = () => {
  console.log(chalk.yellow('|*******************************************************|'));
  console.log(chalk.yellow('|                                                       |'));
  console.log(chalk.yellow('|  Rewards accumulate post-awarding on the PrizePool!   |'));
  console.log(chalk.yellow('|  Withdraw your rewards manually from that contract.   |'));
  console.log(chalk.yellow('|                                                       |'));
  console.log(chalk.yellow('|*******************************************************|'));
};

/**
 * Figures out how much gas is required to run the RngWitnet startDraw contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getStartDrawEstimatedGasLimit = async (
  contract: Contract,
  startDrawTxParams: StartDrawTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    const { value, transformedTxParams } = transformTxParams(startDrawTxParams);

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
 * Determines if the transaction will be profitable.
 *
 * Takes into account the cost of gas, the cost of the reward fee (in the case of an RngAuction start request),
 * and the rewards earned.
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateStartDrawProfit = async (
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
 * Determines if a Award Draw transaction will be profitable.
 *
 * Takes into account the cost of gas for the DrawManager awardDraw(),
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
 * Logs the context to the console
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

const getRngGasCost = async (
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
): Promise<number> => {
  console.log(chalk.blue(`Estimating RNG gas costs ...`));
  printSpacer();

  let estimatedGasLimit, populatedTx;

  const startDrawTxParams = buildStartDrawTxParams(rngAuctionContracts, config, context);
  console.log('startDrawTxParams');
  console.log(startDrawTxParams);
  estimatedGasLimit = await getStartDrawEstimatedGasLimit(
    rngAuctionContracts.rngWitnetContract,
    startDrawTxParams,
  );
  console.log('estimatedGasLimit');
  console.log(estimatedGasLimit);

  const { value, transformedTxParams } = transformTxParams(startDrawTxParams);

  populatedTx = await rngAuctionContracts.rngWitnetContract.populateTransaction.startDraw(
    ...Object.values(transformedTxParams),
    { value },
  );

  // This was a previous tx gas usage on Goerli + buffer room
  // estimatedGasLimit = BigNumber.from(630000);

  const gasCostUsd = await getGasCostUsd(
    estimatedGasLimit,
    config.chainId,
    provider,
    context.nativeTokenMarketRateUsd,
    populatedTx,
  );

  return gasCostUsd;
};

const buildStartDrawTxParams = (
  rngAuctionContracts: RngAuctionContracts,
  config: DrawAuctionConfig,
  context: DrawAuctionContext,
): StartDrawTxParams => {
  console.log(`ethers.utils.parseEther('0.0001000000000')`);
  console.log(ethers.utils.parseEther('0.0001000000000'));
  return {
    drawManagerAddress: rngAuctionContracts.drawManagerContract.address,
    rewardRecipient: config.rewardRecipient,
    // value: '0x1000000000000000', //  '0.0001'
    value: ethers.utils.parseEther('0.00001000000000'), //  1.152921504606846976 ETH
    // value: '0x1000000000000000', //  1.152921504606846976 ETH
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
  console.log(chalk.blue(`Estimating relay gas costs ...`));
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

const sendPopulatedAwardDrawTransaction = async (
  chainId: number,
  wallet: Wallet,
  ozRelayer: Relayer,
  txParams: AwardDrawTxParams,
  contract: Contract,
  config: DrawAuctionConfig,
) => {
  const { gasPrice } = await getGasPrice(config.provider);
  // const gasPrice = BigNumber.from(100000000);

  console.log(chalk.green(`Execute DrawManager#awardDraw`));
  console.log(chalk.greenBright.bold(`Sending ...`));
  printSpacer();

  const populatedTx = await contract.populateTransaction.awardDraw(...Object.values(txParams));

  const gasLimit = 800000;
  const tx = await sendPopulatedTx(
    chainId,
    ozRelayer,
    wallet,
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

const checkOrX = (bool: boolean): string => {
  return bool ? '✔' : '✗';
};
