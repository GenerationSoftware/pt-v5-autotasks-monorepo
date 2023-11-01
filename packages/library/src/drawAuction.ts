import { ethers, BigNumber, Contract, PopulatedTransaction } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';
import { formatUnits } from '@ethersproject/units';
import { Relayer } from 'defender-relay-client';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import chalk from 'chalk';

import { RngAuctionContracts, DrawAuctionContext, DrawAuctionConfigParams, Relay } from './types';
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
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';
import {
  getDrawAuctionContextMulticall,
  DrawAuctionState,
} from './utils/getDrawAuctionContextMulticall';
import { ERC20Abi } from './abis/ERC20Abi';

interface TransferFeeAndStartRngRequestTxParams {
  rewardRecipient: string;
}

interface StartRngRequestTxParams {
  rewardRecipient: string;
}

interface RelayTxParams {
  rngRelayAuctionAddress: string;
  rewardRecipient: string;
}

interface RngAuctionRelayerRemoteOwnerRelayTxParams {
  messageDispatcherAddress: string;
  remoteOwnerChainId: number;
  remoteOwnerAddress: string;
  remoteRngAuctionRelayListenerAddress: string;
  rewardRecipient: string;
  gasLimit: string;
}

const ERC_5164_MESSAGE_DISPATCHER_ADDRESS = {
  1: '0x2A34E6cae749876FB8952aD7d2fA486b00F0683F', // mainnet -> optimism
  5: '0x177B14c6b571262057C3c30E3AE6bB044F62e55c', // goerli -> optimism goerli
  // 42161: '', // mainnet -> arbitrum
  421613: '0xBc244773f71a2f897fAB5D5953AA052B8ff68670', // goerli -> arbitrum goerli
};

const ONE_GWEI = '1000000000';
const RNG_AUCTION_RELAYER_CUSTOM_GAS_LIMIT = '50000';

const instantiateRngAuctionContracts = (
  rngChainId: number,
  rngReadProvider: Provider,
  rngContracts: ContractsBlob,
): RngAuctionContracts => {
  const version = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  // Start RNG Request Chain Contracts
  const rngAuctionContract = getContract(
    'RngAuction',
    rngChainId,
    rngReadProvider,
    rngContracts,
    version,
  );
  const chainlinkVRFV2DirectRngAuctionHelperContract = getContract(
    'ChainlinkVRFV2DirectRngAuctionHelper',
    rngChainId,
    rngReadProvider,
    rngContracts,
    version,
  );
  const rngAuctionRelayerRemoteOwnerContract = getContract(
    'RngAuctionRelayerRemoteOwner',
    rngChainId,
    rngReadProvider,
    rngContracts,
    version,
  );

  let rngAuctionRelayerDirect: Contract;
  try {
    rngAuctionRelayerDirect = getContract(
      'RngAuctionRelayerDirect',
      rngChainId,
      rngReadProvider,
      rngContracts,
      version,
    );
  } catch (e) {
    printSpacer();
    console.log(
      chalk.yellow(
        'No RngAuctionRelayerDirect contract found on the RNG L1 chain, perhaps PrizePool does not exist on this chain?',
      ),
    );
    printSpacer();
  }

  logTable({
    chainlinkVRFV2DirectRngAuctionHelperContract:
      chainlinkVRFV2DirectRngAuctionHelperContract.address,
    rngAuctionContract: rngAuctionContract.address,
    rngAuctionRelayerRemoteOwnerContract: rngAuctionRelayerRemoteOwnerContract.address,
    rngAuctionRelayerDirect: rngAuctionRelayerDirect?.address,
  });

  return {
    chainlinkVRFV2DirectRngAuctionHelperContract,
    rngAuctionContract,
    rngAuctionRelayerRemoteOwnerContract,
    rngAuctionRelayerDirect,
  };
};

const instantiateRelayAuctionContracts = (relays: Relay[]): Relay[] => {
  const version = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  for (const relay of relays) {
    // Relayer / PrizePool Chain Contracts
    const prizePoolContract = getContract(
      'PrizePool',
      relay.chainId,
      relay.readProvider,
      relay.contractsBlob,
      version,
    );
    const rngRelayAuctionContract = getContract(
      'RngRelayAuction',
      relay.chainId,
      relay.readProvider,
      relay.contractsBlob,
      version,
    );
    const remoteOwnerContract = getContract(
      'RemoteOwner',
      relay.chainId,
      relay.readProvider,
      relay.contractsBlob,
      version,
    );

    logTable({
      prizePoolContract: prizePoolContract.address,
      remoteOwnerContract: remoteOwnerContract.address,
      rngRelayAuctionContract: rngRelayAuctionContract.address,
    });

    relay.contracts = {
      prizePoolContract,
      remoteOwnerContract,
      rngRelayAuctionContract,
    };
  }

  return relays;
};

/**
 * Figures out the current state of the Rng / RngRelay Auction and if it's profitable
 * to run any of the transactions, populates and returns the tx object
 *
 * @returns {undefined} void function
 */
export async function executeDrawAuctionTxs(
  rngContracts: ContractsBlob,
  rngRelayer: Relayer,
  params: DrawAuctionConfigParams,
  relays: Relay[],
  signer: DefenderRelaySigner,
): Promise<void> {
  const { rngChainId, relayerAddress, rewardRecipient, rngReadProvider, covalentApiKey } = params;

  const rngAuctionContracts = instantiateRngAuctionContracts(
    rngChainId,
    rngReadProvider,
    rngContracts,
  );

  relays = instantiateRelayAuctionContracts(relays);
  console.log('relays');
  console.log(relays);

  // #1. Get info about the prize pool prize/reserve token, auction states, etc.
  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    rngChainId,
    rngReadProvider,
    relays,
    rngAuctionContracts,
    relayerAddress,
    rewardRecipient,
    covalentApiKey,
  );

  printContext(rngChainId, relays, context);

  if (!context.drawAuctionState) {
    printAsterisks();
    console.log(chalk.yellow(`Currently no Rng or RngRelay auctions to complete. Exiting ...`));
    printSpacer();
    return;
  }

  printSpacer();
  printSpacer();

  // #3. If there is an RNG Fee, figure out if the bot can afford it
  if (context.drawAuctionState === DrawAuctionState.RngStartVrfHelper) {
    console.log(chalk.blue(`Checking Relayer's RNG Fee token balance ...`));
    printSpacer();

    checkBalance(context);
    await increaseRngFeeAllowance(signer, relayerAddress, context, rngAuctionContracts);
  }

  printSpacer();
  printSpacer();
  // #4. Calculate profit and send transactions when profitable
  let rewardUsd = 0;
  if (
    context.drawAuctionState === DrawAuctionState.RngStartVrfHelper ||
    context.drawAuctionState === DrawAuctionState.RngStart
  ) {
    rewardUsd = context.rngExpectedRewardTotalUsd;

    const gasCostUsd = await getRngGasCost(rngReadProvider, rngAuctionContracts, params, context);
    if (gasCostUsd === 0) {
      printAsterisks();
      console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
      return;
    }

    const profitable = await calculateRngProfit(params, rewardUsd, gasCostUsd, context);

    if (profitable) {
      await sendStartRngTransaction(
        rngRelayer,
        rngReadProvider,
        rngAuctionContracts,
        params,
        context,
      );
    } else {
      console.log(
        chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
      );
    }
  } else if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    for (const relay of relays) {
      await processRelayTransaction(relay, rngAuctionContracts, params, context);
    }
  }
}

const sendStartRngTransaction = async (
  relayer: Relayer,
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
) => {
  // const isPrivate = canUseIsPrivate(chainId, params.useFlashbots);
  const isPrivate = false;
  console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
  printSpacer();
  const tx = await sendRngTransaction(
    provider,
    relayer,
    isPrivate,
    rngAuctionContracts,
    params,
    context,
  );

  // NOTE: This uses a naive method of waiting for the tx since OZ Defender can
  //       re-submit transactions, effectively giving them different tx hashes
  //       It is likely good enough for these types of transactions but could cause
  //       issues if there are a lot of failures or gas price issues
  //       See querying here:
  //       https://github.com/OpenZeppelin/defender-client/tree/master/packages/relay#querying-transactions
  console.log('Waiting on transaction to be confirmed ...');

  await provider.waitForTransaction(tx.hash);
  console.log('Tx confirmed !');
  printSpacer();

  printNote();
};

const processRelayTransaction = async (
  relay: Relay,
  rngAuctionContracts: RngAuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
) => {
  // This relay reward is different for each chain:
  // ?
  // : context.rngRelayExpectedRewardUsd;

  const gasCostUsd = await getRelayGasCost(relay, rngAuctionContracts, params, context);
  if (gasCostUsd === 0) {
    printAsterisks();
    console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
    return;
  }

  // #6. Decide if profitable or not
  const profitable = await calculateRelayProfit(
    params,
    relay.context.rngRelayExpectedRewardUsd,
    gasCostUsd,
  );

  // #7. Send transaction
  if (profitable) {
    await sendRelayTransaction(relay, params, rngAuctionContracts, context);
  } else {
    console.log(
      chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }
};

const checkBalance = (context: DrawAuctionContext) => {
  logBigNumber(
    `Relayer RNG Fee Token Balance:`,
    context.relayer.rngFeeTokenBalance,
    context.rngFeeToken.decimals,
    context.rngFeeToken.symbol,
  );

  // Bot/Relayer can't afford RNG fee
  if (context.relayer.rngFeeTokenBalance.lt(context.rngFeeAmount)) {
    const diff = context.rngFeeAmount.sub(context.relayer.rngFeeTokenBalance);
    const diffStr = parseFloat(formatUnits(diff, context.rngFeeToken.decimals));

    console.warn(
      chalk.yellow(
        `Need to increase relayer/bot's balance of '${context.rngFeeToken.symbol}' token by ${diffStr} to pay RNG fee.`,
      ),
    );
  } else {
    console.log(chalk.green('Sufficient balance ✔'));

    printSpacer();
    const estimateCount = context.relayer.rngFeeTokenBalance.div(context.rngFeeAmount);
    logStringValue(
      `Estimate DrawAuction RNG requests left at current balance:`,
      estimateCount.toString(),
    );
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

// RPC failing to estimate gas on this specific transaction
//
/**
 * Figures out how much gas is required to run the ChainlinkVRFV2DirectRngAuctionHelper transferFeeAndStartRngRequest contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
// const getTransferFeeAndStartRngRequestEstimatedGasLimit = async (
//   contract: Contract,
//   transferFeeAndStartRngRequestTxParams: TransferFeeAndStartRngRequestTxParams,
// ): Promise<BigNumber> => {
//   let estimatedGasLimit;
//   try {
//     estimatedGasLimit = await contract.estimateGas.transferFeeAndStartRngRequest(
//       ...Object.values(transferFeeAndStartRngRequestTxParams),
//     );
//   } catch (e) {
//     console.log(chalk.red(e));
//   }

//   return estimatedGasLimit;
// };

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
//  * Figures out how much gas is required to run the RngRelayAuction relay contract function
//  *
//  * @returns {Promise} Promise of a BigNumber with the gas limit
//  */
// const getRelayEstimatedGasLimit = async (
//   contract: Contract,
//   relayTxParams: RelayTxParams,
// ): Promise<BigNumber> => {
//   let estimatedGasLimit;
//   try {
//     estimatedGasLimit = await contract.estimateGas.relay(...Object.values(relayTxParams));
//   } catch (e) {
//     console.log(chalk.red(e));
//   }

//   return estimatedGasLimit;
// };

/**
 * Figures out how much gas is required to run the RngAuctionRelayerRemoteOwner relay contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getRngAuctionRelayerRemoteOwnerRelayEstimatedGasLimit = async (
  contract: Contract,
  rngAuctionRelayerRemoteOwnerRelayTxParams: RngAuctionRelayerRemoteOwnerRelayTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await contract.estimateGas.relay(
      ...Object.values(rngAuctionRelayerRemoteOwnerRelayTxParams),
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
const calculateRngProfit = async (
  params: DrawAuctionConfigParams,
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

  const profitable = netProfitUsd > params.minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${params.minProfitThresholdUsd}`,
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
  params: DrawAuctionConfigParams,
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

  const profitable = netProfitUsd > params.minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${params.minProfitThresholdUsd}`,
    'Net Profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    'Profitable?': checkOrX(profitable),
  });
  printSpacer();

  return profitable;
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = (rngChainId: number, relays: Relay[], context: DrawAuctionContext) => {
  printAsterisks();
  printSpacer();
  console.log(chalk.blue.bold(`Tokens:`));

  printSpacer();
  logStringValue(
    `1a. RNG Chain Native/Gas Token ${NETWORK_NATIVE_TOKEN_INFO[rngChainId].symbol} Market Rate (USD):`,
    `$${context.rngNativeTokenMarketRateUsd}`,
  );

  for (const relay of relays) {
    console.log(chalk.yellow(`Chain:`, `${relay.chainId}`));

    logStringValue(
      `1b. Reward Token ${relay.context.rewardToken.symbol} Market Rate (USD):`,
      `$${relay.context.rewardToken.assetRateUsd}`,
    );

    logStringValue(
      `1c. Relay/PrizePool Chain Native/Gas Token ${
        NETWORK_NATIVE_TOKEN_INFO[relay.chainId].symbol
      } Market Rate (USD):`,
      `$${relay.context.nativeTokenMarketRateUsd}`,
    );
  }

  printSpacer();
  logStringValue(
    `1d. RNG Fee Token:`,
    context.rngFeeTokenIsSet ? context.rngFeeToken.symbol : 'n/a',
  );
  if (context.rngFeeTokenIsSet) {
    logBigNumber(
      `1e. Relayer RNG Fee Token Balance:`,
      context.relayer.rngFeeTokenBalance,
      context.rngFeeToken.decimals,
      context.rngFeeToken.symbol,
    );

    logStringValue(`1f. RNG Fee Token Market Rate (USD):`, `$${context.rngFeeToken.assetRateUsd}`);
    logBigNumber(
      `1g. RNG Fee Amount:`,
      context.rngFeeAmount,
      context.rngFeeToken.decimals,
      context.rngFeeToken.symbol,
    );
    logStringValue(`1h. RNG Fee Amount (USD):`, `$${context.rngFeeUsd}`);
    printSpacer();
  }

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`Rng Auction State:`));

  printSpacer();
  logStringValue(`2a. (RngAuction) Auction open? `, `${checkOrX(context.rngIsAuctionOpen)}`);

  if (context.rngIsAuctionOpen) {
    for (const relay of relays) {
      printSpacer();
      logStringValue(
        `2b. (RngAuction) '${relay.chainId}' CHAIN_NAME Expected Reward:`,
        `${relay.context.rngExpectedReward.toString()} ${relay.context.rewardToken.symbol}`,
      );
      console.log(
        chalk.grey(`2c. (RngAuction) '${relay.chainId}' CHAIN_NAME Expected Reward (USD):`),
        chalk.yellow(`$${roundTwoDecimalPlaces(relay.context.rngExpectedRewardUsd)}`),
        chalk.dim(`$${relay.context.rngExpectedRewardUsd}`),
      );
    }

    console.log(
      chalk.grey(`2d. (RngAuction) Expected Reward TOTAL (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(context.rngExpectedRewardTotalUsd)}`),
      chalk.dim(`$${context.rngExpectedRewardTotalUsd}`),
    );
  } else {
    for (const relay of relays) {
      printSpacer();
      logStringValue(
        `'${relay.chainId}' CHAIN_NAME - Can start RNG in:`,
        `${(relay.context.prizePoolOpenDrawEndsAt - Math.ceil(Date.now() / 1000)) / 60} minutes`,
      );
    }
  }

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`RngRelay Auction States:`));

  printSpacer();
  for (const relay of relays) {
    logStringValue(
      `3a. (RngRelayAuction) '${relay.chainId}' CHAIN_NAME Auction open? `,
      `${checkOrX(relay.context.rngRelayIsAuctionOpen)}`,
    );
    if (relay.context.rngRelayIsAuctionOpen) {
      logBigNumber(
        `3b. (RngRelayAuction) '${relay.chainId}' CHAIN_NAME Expected Reward:`,
        relay.context.rngRelayExpectedReward.toString(),
        relay.context.rewardToken.decimals,
        relay.context.rewardToken.symbol,
      );
      console.log(
        chalk.grey(`3c. (RngRelayAuction) '${relay.chainId}' CHAIN_NAME Expected Reward (USD):`),
        chalk.yellow(`$${roundTwoDecimalPlaces(relay.context.rngRelayExpectedRewardUsd)}`),
        chalk.dim(`$${relay.context.rngRelayExpectedRewardUsd}`),
      );
    }

    printSpacer();
    logStringValue(
      `'${relay.chainId}' CHAIN_NAME Relay Last Seq. ID:`,
      `${relay.context.rngRelayLastSequenceId}`,
    );
  }
};

const buildTransferFeeAndStartRngRequestParams = (
  rewardRecipient: string,
): TransferFeeAndStartRngRequestTxParams => {
  return {
    rewardRecipient,
  };
};

const buildStartRngRequestParams = (rewardRecipient: string): StartRngRequestTxParams => {
  return {
    rewardRecipient,
  };
};

const buildRngAuctionRelayerRemoteOwnerRelayTxParams = (
  messageDispatcherAddress: string,
  remoteOwnerChainId: number,
  remoteOwnerAddress: string,
  remoteRngAuctionRelayListenerAddress: string,
  rewardRecipient: string,
): RngAuctionRelayerRemoteOwnerRelayTxParams => {
  return {
    messageDispatcherAddress,
    remoteOwnerChainId,
    remoteOwnerAddress,
    remoteRngAuctionRelayListenerAddress,
    rewardRecipient,
    gasLimit: RNG_AUCTION_RELAYER_CUSTOM_GAS_LIMIT,
  };
};

const buildRelayParams = (
  rngRelayAuctionAddress: string,
  rewardRecipient: string,
): RelayTxParams => {
  return {
    rngRelayAuctionAddress,
    rewardRecipient,
  };
};

const getRngGasCost = async (
  readProvider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
): Promise<number> => {
  console.log(chalk.blue(`Estimating gas costs ...`));
  printSpacer();

  let estimatedGasLimit, populatedTx;
  if (context.drawAuctionState === DrawAuctionState.RngStartVrfHelper) {
    const transferFeeAndStartRngRequestTxParams = buildTransferFeeAndStartRngRequestParams(
      params.rewardRecipient,
    );
    const chainlinkRngAuctionHelperContract =
      rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract;

    // RPC failing to estimate gas on this specific transaction
    // estimatedGasLimit = await getTransferFeeAndStartRngRequestEstimatedGasLimit(
    //   chainlinkRngAuctionHelperContract,
    //   transferFeeAndStartRngRequestTxParams,
    // );

    populatedTx = await chainlinkRngAuctionHelperContract.populateTransaction.transferFeeAndStartRngRequest(
      ...Object.values(transferFeeAndStartRngRequestTxParams),
    );

    // This was a previous tx gas usage on Goerli + buffer room
    estimatedGasLimit = BigNumber.from(330000);
  } else {
    const startRngRequestTxParams = buildStartRngRequestParams(params.rewardRecipient);
    estimatedGasLimit = await getStartRngRequestEstimatedGasLimit(
      rngAuctionContracts.rngAuctionContract,
      startRngRequestTxParams,
    );

    populatedTx = await rngAuctionContracts.rngAuctionContract.populateTransaction.startRngRequest(
      ...Object.values(startRngRequestTxParams),
    );
  }

  const gasCostUsd = await getGasCostUsd(
    estimatedGasLimit,
    params.rngChainId,
    readProvider,
    context.rngNativeTokenMarketRateUsd,
    populatedTx,
  );

  return gasCostUsd;
};

const getRelayGasCost = async (
  relay: Relay,
  rngAuctionContracts: RngAuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
): Promise<number> => {
  console.log(chalk.blue(`Estimating gas costs ...`));
  printSpacer();

  const { chainId, readProvider } = relay;
  const { nativeTokenMarketRateUsd } = relay.context;

  let estimatedGasLimit, populatedTx;
  if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    const rngAuctionRelayerRemoteOwnerRelayTxParams = buildRngAuctionRelayerRemoteOwnerRelayTxParams(
      ERC_5164_MESSAGE_DISPATCHER_ADDRESS[params.rngChainId],
      relay.chainId,
      relay.contracts.remoteOwnerContract.address,
      relay.contracts.rngRelayAuctionContract.address,
      params.rewardRecipient,
    );
    estimatedGasLimit = await getRngAuctionRelayerRemoteOwnerRelayEstimatedGasLimit(
      rngAuctionContracts.rngAuctionRelayerRemoteOwnerContract,
      rngAuctionRelayerRemoteOwnerRelayTxParams,
    );

    populatedTx = await rngAuctionContracts.rngAuctionRelayerRemoteOwnerContract.populateTransaction.relay(
      ...Object.values(rngAuctionRelayerRemoteOwnerRelayTxParams),
    );
  } else {
    // const relayTxParams = buildRelayParams(
    //   relay.contracts.rngRelayAuctionContract.address,
    //   params.rewardRecipient,
    // );
    // estimatedGasLimit = await getRelayEstimatedGasLimit(
    //   relay.contracts.rngAuctionRelayerDirect,
    //   relayTxParams,
    // );
  }

  const gasCostUsd = await getGasCostUsd(
    estimatedGasLimit,
    chainId,
    readProvider,
    nativeTokenMarketRateUsd,
    populatedTx,
  );

  return gasCostUsd;
};

const getGasCostUsd = async (
  estimatedGasLimit,
  chainId,
  readProvider,
  nativeTokenMarketRateUsd,
  populatedTx,
) => {
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

  const { gasPrice } = await getGasPrice(readProvider);
  logBigNumber(
    'Recent Gas Price (wei):',
    gasPrice,
    NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );
  logStringValue('Recent Gas Price (gwei):', `${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);

  // 3. Convert gas costs to USD
  printSpacer();
  const { avgFeeUsd: gasCostUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    nativeTokenMarketRateUsd,
    readProvider,
    populatedTx.data,
  );
  console.log(
    chalk.grey(`Gas Cost (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(gasCostUsd)}`),
    chalk.dim(`$${gasCostUsd}`),
  );
};

const sendRngTransaction = async (
  provider: Provider,
  relayer: Relayer,
  isPrivate: boolean,
  rngAuctionContracts: RngAuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
) => {
  console.log(chalk.yellow(`Submitting transaction:`));

  let populatedTx: PopulatedTransaction;
  console.log(
    chalk.green(`Execute ChainlinkVRFV2DirectRngAuctionHelper#transferFeeAndStartRngRequest`),
  );
  printSpacer();

  const startRngRequestTxParams = buildStartRngRequestParams(params.rewardRecipient);
  const chainlinkRngAuctionHelper =
    rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract;
  populatedTx = await chainlinkRngAuctionHelper.populateTransaction.transferFeeAndStartRngRequest(
    ...Object.values(startRngRequestTxParams),
  );
  // populatedTx = await auctionContracts.rngAuctionContract.populateTransaction.startRngRequest(
  //   ...Object.values(startRngRequestTxParams),
  // );

  const { gasPrice } = await getGasPrice(provider);
  console.log(chalk.greenBright.bold(`Sending transaction ...`));
  const tx = await relayer.sendTransaction({
    isPrivate,
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit: 400000,
    gasPrice: gasPrice.add(ONE_GWEI).toString(),
  });

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

  return tx;
};

const sendRelayTransaction = async (
  relay: Relay,
  params: DrawAuctionConfigParams,
  rngAuctionContracts: RngAuctionContracts,
  context: DrawAuctionContext,
) => {
  const { readProvider, relayer } = relay;

  console.log(chalk.yellow(`Submitting transaction:`));

  // const isPrivate = canUseIsPrivate(chainId, params.useFlashbots);
  const isPrivate = false;
  console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
  printSpacer();
  const { gasPrice } = await getGasPrice(readProvider);
  console.log(chalk.greenBright.bold(`Sending transaction ...`));

  console.log(chalk.green(`Execute RngAuctionRelayerRemoteOwner#relay`));
  printSpacer();

  const relayTxParams = buildRngAuctionRelayerRemoteOwnerRelayTxParams(
    ERC_5164_MESSAGE_DISPATCHER_ADDRESS[params.rngChainId],
    relay.chainId,
    relay.contracts.remoteOwnerContract.address,
    relay.contracts.rngRelayAuctionContract.address,
    params.rewardRecipient,
  );
  const populatedTx: PopulatedTransaction = await rngAuctionContracts.rngAuctionRelayerRemoteOwnerContract.populateTransaction.relay(
    ...Object.values(relayTxParams),
  );
  // console.log(chalk.green(`Execute RngAuctionRelayerDirect#relay`));
  // printSpacer();

  // const relayTxParams = buildRelayParams(
  //   auctionContracts.rngRelayAuctionContract.address,
  //   params.rewardRecipient,
  // );
  // populatedTx = await auctionContracts.rngAuctionRelayerDirect.populateTransaction.relay(
  //   ...Object.values(relayTxParams),
  // );

  const tx = await relayer.sendTransaction({
    isPrivate,
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit: 400000,
    gasPrice: gasPrice.add(ONE_GWEI).toString(),
  });

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
  console.log('Waiting on transaction to be confirmed ...');
  await readProvider.waitForTransaction(tx.hash);

  console.log('Tx confirmed !');
  printSpacer();
  printNote();

  return tx;
};

const increaseRngFeeAllowance = async (
  signer,
  relayerAddress: string,
  context: DrawAuctionContext,
  rngAuctionContracts: RngAuctionContracts,
) => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`Checking allowance ...`));
  printSpacer();
  // Increase allowance if necessary - so the RNG Auction contract can spend the bot's RNG Fee Token
  approve(signer, relayerAddress, rngAuctionContracts, context);
};

/**
 * Allowance - Give permission to the RngAuctionHelper contract to spend our Relayer/Bot's
 * RNG Fee Token (likely LINK). We will set allowance to max as we trust the security of the
 * RngAuctionHelper contract (you may want to change this!)
 * @returns {undefined} - void function
 */
const approve = async (
  signer,
  relayerAddress: string,
  rngAuctionContracts: RngAuctionContracts,
  context: DrawAuctionContext,
) => {
  try {
    const rngFeeTokenContract = new ethers.Contract(context.rngFeeToken.address, ERC20Abi, signer);

    const allowance = context.relayer.rngFeeTokenAllowance;

    if (allowance.lt(context.rngFeeAmount)) {
      // Use the RngAuctionHelper if this is Chainlink VRFV2
      console.log(
        chalk.yellowBright(
          `Increasing relayer '${relayerAddress}' ${context.rngFeeToken.symbol} allowance for the ChainlinkVRFV2DirectRngAuctionHelper to maximum ...`,
        ),
      );

      const tx = await rngFeeTokenContract.approve(
        rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
        ethers.constants.MaxInt256,
      );
      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
      await tx.wait();

      const newAllowanceResult = await rngFeeTokenContract.allowance(
        relayerAddress,
        rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
      );
      console.log('newAllowanceResult');
      console.log(newAllowanceResult);
      logStringValue('New allowance:', newAllowanceResult[0].toString());
    } else {
      console.log(chalk.green('Sufficient allowance ✔'));
    }
  } catch (error) {
    console.log(chalk.red('error: ', error));
  }
};

const checkOrX = (bool: boolean): string => {
  return bool ? '✔' : '✗';
};

const getRelayer = (rngRelayer: Relayer, relayRelayer: Relayer, context: DrawAuctionContext) => {
  if (context.drawAuctionState === DrawAuctionState.RngStart) {
    return relayRelayer;
  } else if (context.drawAuctionState === DrawAuctionState.RngStartVrfHelper) {
    return rngRelayer;
  } else if (context.drawAuctionState === DrawAuctionState.RngRelayDirect) {
    return rngRelayer;
  } else if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    return rngRelayer;
  }
};

const getChainId = (rngChainId: number, relayChainId: number, context: DrawAuctionContext) => {
  if (context.drawAuctionState === DrawAuctionState.RngStart) {
    return relayChainId;
  } else if (context.drawAuctionState === DrawAuctionState.RngStartVrfHelper) {
    return rngChainId;
  } else if (context.drawAuctionState === DrawAuctionState.RngRelayDirect) {
    return rngChainId;
  } else if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    return rngChainId;
  }
};

const getProvider = (
  rngReadProvider: Provider,
  relayReadProvider: Provider,
  context: DrawAuctionContext,
) => {
  if (context.drawAuctionState === DrawAuctionState.RngStart) {
    return relayReadProvider;
  } else if (context.drawAuctionState === DrawAuctionState.RngStartVrfHelper) {
    return rngReadProvider;
  } else if (context.drawAuctionState === DrawAuctionState.RngRelayDirect) {
    return rngReadProvider;
  } else if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    return rngReadProvider;
  }
};
