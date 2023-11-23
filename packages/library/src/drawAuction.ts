import { ethers, BigNumber, Contract, PopulatedTransaction } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract } from '@generationsoftware/pt-v5-utils-js';
import { Relayer } from 'defender-relay-client';
import { formatUnits } from '@ethersproject/units';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import chalk from 'chalk';

import { AuctionContracts, DrawAuctionContext, DrawAuctionConfigParams } from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  canUseIsPrivate,
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
  // 5: '0xBc244773f71a2f897fAB5D5953AA052B8ff68670', // goerli -> arbitrum goerli
};

const ONE_GWEI = '1000000000';
const RNG_AUCTION_RELAYER_CUSTOM_GAS_LIMIT = '50000';

const getAuctionContracts = (
  rngChainId: number,
  relayChainId: number,
  rngReadProvider: Provider,
  relayReadProvider: Provider,
  rngContracts: ContractsBlob,
  relayContracts: ContractsBlob,
): AuctionContracts => {
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

  // Relayer / PrizePool Chain Contracts
  const prizePoolContract = getContract(
    'PrizePool',
    relayChainId,
    relayReadProvider,
    relayContracts,
    version,
  );
  const rngRelayAuctionContract = getContract(
    'RngRelayAuction',
    relayChainId,
    relayReadProvider,
    relayContracts,
    version,
  );
  const remoteOwnerContract = getContract(
    'RemoteOwner',
    relayChainId,
    relayReadProvider,
    relayContracts,
    version,
  );

  logTable({
    prizePoolContract: prizePoolContract.address,
    chainlinkVRFV2DirectRngAuctionHelperContract:
      chainlinkVRFV2DirectRngAuctionHelperContract.address,
    remoteOwnerContract: remoteOwnerContract.address,
    rngAuctionContract: rngAuctionContract.address,
    rngRelayAuctionContract: rngRelayAuctionContract.address,
    rngAuctionRelayerRemoteOwnerContract: rngAuctionRelayerRemoteOwnerContract.address,
    rngAuctionRelayerDirect: rngAuctionRelayerDirect?.address,
  });

  return {
    prizePoolContract,
    chainlinkVRFV2DirectRngAuctionHelperContract,
    remoteOwnerContract,
    rngAuctionContract,
    rngRelayAuctionContract,
    rngAuctionRelayerRemoteOwnerContract,
    rngAuctionRelayerDirect,
  };
};

/**
 * Figures out the current state of the Rng / RngRelay Auction and if it's profitable
 * to run any of the transactions, populates and returns the tx object
 *
 * @returns {undefined} void function
 */
export async function prepareDrawAuctionTxs(
  rngContracts: ContractsBlob,
  relayContracts: ContractsBlob,
  rngRelayer: Relayer,
  relayRelayer: Relayer,
  params: DrawAuctionConfigParams,
  signer: DefenderRelaySigner,
): Promise<void> {
  const {
    rngChainId,
    relayChainId,
    relayerAddress,
    rewardRecipient,
    rngReadProvider,
    relayReadProvider,
    covalentApiKey,
  } = params;

  const auctionContracts = getAuctionContracts(
    rngChainId,
    relayChainId,
    rngReadProvider,
    relayReadProvider,
    rngContracts,
    relayContracts,
  );

  // #1. Get info about the prize pool prize/reserve token, auction states, etc.
  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    rngChainId,
    rngReadProvider,
    relayChainId,
    relayReadProvider,
    auctionContracts,
    relayerAddress,
    rewardRecipient,
    covalentApiKey,
  );

  printContext(rngChainId, relayChainId, context);

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
    await checkBalance(context);
    await increaseRngFeeAllowance(signer, relayerAddress, context, auctionContracts);
  }

  printSpacer();
  printSpacer();

  // #4. Estimate gas costs
  console.log(chalk.blue(`Estimating gas costs ...`));
  printSpacer();
  const gasCostUsd = await getGasCost(rngReadProvider, auctionContracts, params, context);
  if (gasCostUsd === 0) {
    printAsterisks();
    console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
    return;
  }

  // #5. Find reward in USD
  const rewardUsd =
    context.drawAuctionState === DrawAuctionState.RngStartVrfHelper ||
    context.drawAuctionState === DrawAuctionState.RngStart
      ? context.rngExpectedRewardUsd
      : context.rngRelayExpectedRewardUsd;

  // #6. Decide if profitable or not
  const profitable = await calculateProfit(params, rewardUsd, gasCostUsd, context);

  // #7. Populate transaction
  if (profitable) {
    const relayer = getRelayer(rngRelayer, relayRelayer, context);
    const chainId = getChainId(rngChainId, relayChainId, context);
    const provider = getProvider(rngReadProvider, relayReadProvider, context);

    // const isPrivate = canUseIsPrivate(chainId, params.useFlashbots);
    const isPrivate = false;
    console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
    printSpacer();
    const tx = await sendTransaction(
      provider,
      relayer,
      isPrivate,
      auctionContracts,
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
  } else {
    console.log(
      chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }
}

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
const calculateProfit = async (
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

  let netProfitUsd;
  if (context.rngIsAuctionOpen && context.rngFeeTokenIsSet && context.rngFeeUsd > 0) {
    netProfitUsd = grossProfitUsd - gasCostUsd - context.rngFeeUsd;
    console.log(chalk.magenta('Net profit = (Gross Profit - Gas Fees [Max] - RNG Fee)'));
    console.log(
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
          rewardUsd,
        )} - $${roundTwoDecimalPlaces(gasCostUsd)} - $${roundTwoDecimalPlaces(context.rngFeeUsd)})`,
      ),
      chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${gasCostUsd} - $${context.rngFeeUsd})`),
    );
  } else {
    netProfitUsd = grossProfitUsd - gasCostUsd;
    console.log(chalk.magenta('Net profit = (Gross Profit - Gas Fees [Max])'));
    console.log(
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
          rewardUsd,
        )} - $${roundTwoDecimalPlaces(gasCostUsd)})`,
      ),
      chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${gasCostUsd})`),
    );
  }

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
const printContext = (rngChainId: number, relayChainId: number, context: DrawAuctionContext) => {
  printAsterisks();
  printSpacer();
  console.log(chalk.blue.bold(`Tokens:`));

  printSpacer();
  logStringValue(
    `1a. RNG Chain Native/Gas Token ${NETWORK_NATIVE_TOKEN_INFO[rngChainId].symbol} Market Rate (USD):`,
    `$${context.rngNativeTokenMarketRateUsd}`,
  );
  logStringValue(
    `1b. Reward Token ${context.rewardToken.symbol} Market Rate (USD):`,
    `$${context.rewardToken.assetRateUsd}`,
  );

  logStringValue(
    `1c. Relay/PrizePool Chain Native/Gas Token ${NETWORK_NATIVE_TOKEN_INFO[relayChainId].symbol} Market Rate (USD):`,
    `$${context.relayNativeTokenMarketRateUsd}`,
  );

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
    printSpacer();
    logStringValue(
      `2b. (RngAuction) Expected Reward:`,
      `${context.rngExpectedReward.toString()} ${context.rewardToken.symbol}`,
    );
    console.log(
      chalk.grey(`2c. (RngAuction) Expected Reward (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(context.rngExpectedRewardUsd)}`),
      chalk.dim(`$${context.rngExpectedRewardUsd}`),
    );
  }

  printSpacer();
  logStringValue(
    `Can start RNG in:`,
    `${(context.prizePoolOpenDrawEndsAt - Math.ceil(Date.now() / 1000)) / 60} minutes`,
  );

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`RngRelay Auction State:`));

  printSpacer();
  logStringValue(
    `3a. (RngRelayAuction) Auction open? `,
    `${checkOrX(context.rngRelayIsAuctionOpen)}`,
  );
  if (context.rngRelayIsAuctionOpen) {
    logBigNumber(
      `3b. (RngRelayAuction) Expected Reward:`,
      context.rngRelayExpectedReward.toString(),
      context.rewardToken.decimals,
      context.rewardToken.symbol,
    );
    console.log(
      chalk.grey(`3c. (RngRelayAuction) Expected Reward (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(context.rngRelayExpectedRewardUsd)}`),
      chalk.dim(`$${context.rngRelayExpectedRewardUsd}`),
    );
  }

  printSpacer();
  logStringValue(`Relay Last Seq. ID:`, `${context.rngRelayLastSequenceId}`);
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

const getGasCost = async (
  readProvider: Provider,
  auctionContracts: AuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
): Promise<number> => {
  let estimatedGasLimit, populatedTx;
  if (
    context.drawAuctionState === DrawAuctionState.RngStart ||
    context.drawAuctionState === DrawAuctionState.RngStartVrfHelper
  ) {
    if (context.drawAuctionState === DrawAuctionState.RngStartVrfHelper) {
      const transferFeeAndStartRngRequestTxParams = buildTransferFeeAndStartRngRequestParams(
        params.rewardRecipient,
      );
      const chainlinkRngAuctionHelperContract =
        auctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract;

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
        auctionContracts.rngAuctionContract,
        startRngRequestTxParams,
      );

      populatedTx = await auctionContracts.rngAuctionContract.populateTransaction.startRngRequest(
        ...Object.values(startRngRequestTxParams),
      );
    }
  } else {
    if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
      const rngAuctionRelayerRemoteOwnerRelayTxParams = buildRngAuctionRelayerRemoteOwnerRelayTxParams(
        ERC_5164_MESSAGE_DISPATCHER_ADDRESS[params.rngChainId],
        params.relayChainId,
        auctionContracts.remoteOwnerContract.address,
        auctionContracts.rngRelayAuctionContract.address,
        params.rewardRecipient,
      );
      estimatedGasLimit = await getRngAuctionRelayerRemoteOwnerRelayEstimatedGasLimit(
        auctionContracts.rngAuctionRelayerRemoteOwnerContract,
        rngAuctionRelayerRemoteOwnerRelayTxParams,
      );

      populatedTx = await auctionContracts.rngAuctionRelayerRemoteOwnerContract.populateTransaction.relay(
        ...Object.values(rngAuctionRelayerRemoteOwnerRelayTxParams),
      );
    } else {
      // const relayTxParams = buildRelayParams(
      //   auctionContracts.rngRelayAuctionContract.address,
      //   params.rewardRecipient,
      // );
      // estimatedGasLimit = await getRelayEstimatedGasLimit(
      //   auctionContracts.rngAuctionRelayerDirect,
      //   relayTxParams,
      // );
    }
  }

  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellow('Estimated gas limit is 0 ...'));
    return 0;
  } else {
    logBigNumber(
      'Estimated gas limit (wei):',
      estimatedGasLimit,
      NETWORK_NATIVE_TOKEN_INFO[params.rngChainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[params.rngChainId].symbol,
    );
  }

  const { gasPrice } = await getGasPrice(readProvider);
  logBigNumber(
    'Recent Gas Price (wei):',
    gasPrice,
    NETWORK_NATIVE_TOKEN_INFO[params.rngChainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[params.rngChainId].symbol,
  );
  logStringValue('Recent Gas Price (gwei):', `${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);

  // 3. Convert gas costs to USD
  printSpacer();
  const { avgFeeUsd: gasCostUsd } = await getFeesUsd(
    params.rngChainId,
    estimatedGasLimit,
    context.rngNativeTokenMarketRateUsd,
    readProvider,
    populatedTx.data,
  );
  console.log(
    chalk.grey(`Gas Cost (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(gasCostUsd)}`),
    chalk.dim(`$${gasCostUsd}`),
  );

  return gasCostUsd;
};

const sendTransaction = async (
  provider: Provider,
  relayer: Relayer,
  isPrivate: boolean,
  auctionContracts: AuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
) => {
  console.log(chalk.yellow(`Submitting transaction:`));

  let populatedTx: PopulatedTransaction;
  if (context.drawAuctionState === DrawAuctionState.RngStartVrfHelper) {
    console.log(
      chalk.green(`Execute ChainlinkVRFV2DirectRngAuctionHelper#transferFeeAndStartRngRequest`),
    );
    printSpacer();

    const startRngRequestTxParams = buildStartRngRequestParams(params.rewardRecipient);
    const chainlinkRngAuctionHelper = auctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract;
    populatedTx = await chainlinkRngAuctionHelper.populateTransaction.transferFeeAndStartRngRequest(
      ...Object.values(startRngRequestTxParams),
    );
    // populatedTx = await auctionContracts.rngAuctionContract.populateTransaction.startRngRequest(
    //   ...Object.values(startRngRequestTxParams),
    // );
  } else {
    console.log(chalk.green(`Execute RngAuctionRelayerRemoteOwner#relay`));
    printSpacer();

    const relayTxParams = buildRngAuctionRelayerRemoteOwnerRelayTxParams(
      ERC_5164_MESSAGE_DISPATCHER_ADDRESS[params.rngChainId],
      params.relayChainId,
      auctionContracts.remoteOwnerContract.address,
      auctionContracts.rngRelayAuctionContract.address,
      params.rewardRecipient,
    );
    populatedTx = await auctionContracts.rngAuctionRelayerRemoteOwnerContract.populateTransaction.relay(
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
  }

  const { gasPrice } = await getGasPrice(provider);
  console.log(chalk.greenBright.bold(`Sending transaction ...`));
  const tx = await relayer.sendTransaction({
    isPrivate,
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit: 500000,
    gasPrice: gasPrice.add(ONE_GWEI).toString(),
  });

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

  return tx;
};

const increaseRngFeeAllowance = async (
  signer,
  relayerAddress: string,
  context: DrawAuctionContext,
  auctionContracts: AuctionContracts,
) => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`Checking allowance ...`));
  printSpacer();
  // Increase allowance if necessary - so the RNG Auction contract can spend the bot's RNG Fee Token
  approve(signer, relayerAddress, auctionContracts, context);
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
  auctionContracts: AuctionContracts,
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
        auctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
        ethers.constants.MaxInt256,
      );
      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
      await tx.wait();

      const newAllowanceResult = await rngFeeTokenContract.allowance(
        relayerAddress,
        auctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
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
