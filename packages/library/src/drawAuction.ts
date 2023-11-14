import { ethers, BigNumber, Contract, PopulatedTransaction, Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractsBlob, getContract, getContracts } from '@generationsoftware/pt-v5-utils-js';
import { formatUnits } from '@ethersproject/units';
import { Relayer } from 'defender-relay-client';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import chalk from 'chalk';

import { getArbitrumRelayTxParamsVars } from './getRelayTxParams';
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
import {
  ERC_5164_MESSAGE_DISPATCHER_ADDRESS,
  RNG_AUCTION_RELAYER_REMOTE_OWNER_ADDRESS,
} from './constants';
import { chainName, CHAIN_IDS, NETWORK_NATIVE_TOKEN_INFO } from './utils/network';
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

interface RngAuctionRelayerRemoteOwnerOptimismRelayTxParams {
  messageDispatcherAddress: string;
  remoteOwnerChainId: number;
  remoteOwnerAddress: string;
  remoteRngAuctionRelayListenerAddress: string;
  rewardRecipient: string;
  gasLimit: string;
}

interface RngAuctionRelayerRemoteOwnerArbitrumRelayTxParams {
  messageDispatcherAddress: string;
  remoteOwnerChainId: number;
  remoteOwnerAddress: string;
  remoteRngAuctionRelayListenerAddress: string;
  rewardRecipient: string;
  refundAddress: string;
  gasLimit: BigNumber;
  maxSubmissionCost: BigNumber;
  gasPriceBid: BigNumber;
}

interface SendTransactionArgs {
  data: string;
  to: string;
  gasLimit: number;
  gasPrice: string;
  isPrivate?: boolean;
}

const ONE_GWEI = '1000000000';
const RNG_AUCTION_RELAYER_OPTIMISM_CUSTOM_GAS_LIMIT = '50000';

// Instantiates all RngAuctionRelayerRemoteOwner* contracts that are found in the ContractsBlob
const instantiateAllRngAuctionRelayerRemoteOwnerContracts = (
  rngChainId: number,
  rngProvider: any,
  rngContracts: ContractsBlob,
  version = {
    major: 1,
    minor: 0,
    patch: 0,
  },
): Contract[] => {
  let rngAuctionRelayerRemoteOwnerContracts = [];
  try {
    rngAuctionRelayerRemoteOwnerContracts = getContracts(
      'RngAuctionRelayerRemoteOwner',
      rngChainId,
      rngProvider,
      rngContracts,
      version,
    );
  } catch (e) {
    console.log(
      chalk.dim(
        'No RngAuctionRelayerRemoteOwner contracts found on the RNG L1 chain (this is likely to be expected).',
      ),
    );
  }

  let rngAuctionRelayerRemoteOwnerOptimismContracts = [];
  try {
    rngAuctionRelayerRemoteOwnerOptimismContracts = getContracts(
      'RngAuctionRelayerRemoteOwnerOptimism',
      rngChainId,
      rngProvider,
      rngContracts,
      version,
    );
  } catch (e) {
    console.log(
      chalk.yellow('No RngAuctionRelayerRemoteOwnerOptimism contracts found on the RNG L1 chain?'),
    );
  }

  let rngAuctionRelayerRemoteOwnerArbitrumContracts = [];
  try {
    rngAuctionRelayerRemoteOwnerArbitrumContracts = getContracts(
      'RngAuctionRelayerRemoteOwnerArbitrum',
      rngChainId,
      rngProvider,
      rngContracts,
      version,
    );
  } catch (e) {
    console.log(
      chalk.yellow('No RngAuctionRelayerRemoteOwnerOptimism contracts found on the RNG L1 chain?'),
    );
  }

  return [
    ...rngAuctionRelayerRemoteOwnerContracts,
    ...rngAuctionRelayerRemoteOwnerOptimismContracts,
    ...rngAuctionRelayerRemoteOwnerArbitrumContracts,
  ];
};

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

  printSpacer();
  printSpacer();
  console.log(chalk.dim('L1: Instantiating RNG contracts ...'));
  printSpacer();

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

  const rngAuctionRelayerRemoteOwnerContracts = instantiateAllRngAuctionRelayerRemoteOwnerContracts(
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
    console.log(
      chalk.dim(
        'No RngAuctionRelayerDirect contract found on the RNG L1 chain - possible a PrizePool does not exist on this chain.',
      ),
    );
  }

  printSpacer();
  logTable({
    chainlinkVRFV2DirectRngAuctionHelperContract:
      chainlinkVRFV2DirectRngAuctionHelperContract.address,
    rngAuctionContract: rngAuctionContract.address,
    rngAuctionRelayerDirect: rngAuctionRelayerDirect?.address,
  });
  printSpacer();

  console.log(chalk.dim('RngAuctionRelayerRemoteOwnerContracts:'));
  for (const contract of rngAuctionRelayerRemoteOwnerContracts) {
    console.log(chalk.yellow(`rngAuctionRelayerRemoteOwnerContract: ${contract.address}`));
  }
  printSpacer();

  return {
    chainlinkVRFV2DirectRngAuctionHelperContract,
    rngAuctionContract,
    rngAuctionRelayerRemoteOwnerContracts,
    rngAuctionRelayerDirect,
  };
};

const instantiateRelayAuctionContracts = (relays: Relay[]): Relay[] => {
  const version = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  printSpacer();
  console.log(chalk.dim('L2: Instantiating relay contracts ...'));

  for (const relay of relays) {
    printSpacer();
    console.log(chalk.cyan(`${chainName(relay.chainId)}:`));

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
  params: DrawAuctionConfigParams,
  relays: Relay[],
): Promise<void> {
  const {
    rngChainId,
    rngReadProvider,
    rngRelayer,
    rngRelayerAddress,
    signer,
    rewardRecipient,
    covalentApiKey,
  } = params;

  const rngAuctionContracts = instantiateRngAuctionContracts(
    rngChainId,
    rngReadProvider,
    rngContracts,
  );

  relays = instantiateRelayAuctionContracts(relays);

  // #1. Get info about the prize pool prize/reserve token, auction states, etc.
  const context: DrawAuctionContext = await getDrawAuctionContextMulticall(
    rngChainId,
    rngReadProvider,
    relays,
    rngAuctionContracts,
    rngRelayerAddress,
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
    await increaseRngFeeAllowance(signer, rngRelayerAddress, context, rngAuctionContracts);
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

    console.log('rewardUsd');
    console.log(rewardUsd);
    console.log('gasCostUsd');
    console.log(gasCostUsd);

    const profitable = await calculateRngProfit(params, rewardUsd, gasCostUsd, context);

    if (profitable) {
      await sendStartRngTransaction(rngRelayer, rngReadProvider, rngAuctionContracts, params);
    } else {
      console.log(
        chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
      );
    }
  } else if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    for (const relay of relays) {
      await processRelayTransaction(rngRelayer, relay, rngAuctionContracts, params, context);
    }
  }
}

const sendStartRngTransaction = async (
  rngRelayer: Relayer | Wallet,
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  params: DrawAuctionConfigParams,
) => {
  // const isPrivate = canUseIsPrivate(chainId, params.useFlashbots);
  const isPrivate = false;
  console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
  printSpacer();

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

  const { gasPrice } = await getGasPrice(provider);
  console.log(chalk.greenBright.bold(`Sending transaction ...`));

  let sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit: 400000,
    gasPrice: gasPrice.add(ONE_GWEI).toString(),
  };

  if (rngRelayer.constructor.name === 'Relayer') {
    sendTransactionArgs.isPrivate = isPrivate;
  }
  const tx = await rngRelayer.sendTransaction(sendTransactionArgs);

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

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
  rngRelayer: Relayer | Wallet,
  relay: Relay,
  rngAuctionContracts: RngAuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
) => {
  const { chainId } = relay;
  // console.log('rngAuctionContracts');
  // console.log(rngAuctionContracts);
  // console.log('chainId');
  // console.log(chainId);

  const contract = findRngAuctionRelayerRemoteOwnerContract(chainId, rngAuctionContracts);
  // console.log('contract');
  // console.log(contract);

  console.log('fail?');
  console.log('relay');
  console.log(relay);
  console.log('params');
  console.log(params);
  console.log('context');
  console.log(context);

  const txParams = await getRelayTxParams(relay, params, context);
  console.log('txParams');
  console.log(txParams);

  // #5. Get gas cost
  const gasCostUsd = await getRelayGasCost(txParams, relay, contract, context);
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
    await sendRelayTransaction(rngRelayer, txParams, relay, contract, context);
  } else {
    console.log(
      chalk.yellow(`Completing current auction currently not profitable. Try again soon ...`),
    );
  }
};

const checkBalance = (context: DrawAuctionContext) => {
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
  } else {
    console.log(chalk.green('Sufficient balance ✔'));

    printSpacer();
    const estimateCount = context.rngRelayer.rngFeeTokenBalance.div(context.rngFeeAmount);
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
 * Figures out how much gas is required to run the RngAuctionRelayerRemoteOwnerOptimism relay contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getRngAuctionRelayerRemoteOwnerOptimismRelayEstimatedGasLimit = async (
  contract: Contract,
  rngAuctionRelayerRemoteOwnerOptimismRelayTxParams: RngAuctionRelayerRemoteOwnerOptimismRelayTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await contract.estimateGas.relay(
      ...Object.values(rngAuctionRelayerRemoteOwnerOptimismRelayTxParams),
    );
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
};

/**
 * Figures out how much gas is required to run the RngAuctionRelayerRemoteOwnerArbitrum relay contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getRngAuctionRelayerRemoteOwnerArbitrumRelayEstimatedGasLimit = async (
  contract: Contract,
  rngAuctionRelayerRemoteOwnerArbitrumRelayTxParams: RngAuctionRelayerRemoteOwnerArbitrumRelayTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await contract.estimateGas.relay(
      ...Object.values(rngAuctionRelayerRemoteOwnerArbitrumRelayTxParams),
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

  console.log('gasCostUsd');
  console.log(gasCostUsd);
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

  printSpacer();
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

  for (const relay of relays) {
    printSpacer();
    console.log(chalk.yellow(chainName(relay.chainId)));

    logStringValue(
      `1b. Reward Token '${relay.context.rewardToken.symbol}' Market Rate (USD):`,
      `$${relay.context.rewardToken.assetRateUsd}`,
    );

    logStringValue(
      `1c. Relay Chain Gas Token ${
        NETWORK_NATIVE_TOKEN_INFO[relay.chainId].symbol
      } Market Rate (USD):`,
      `$${relay.context.nativeTokenMarketRateUsd}`,
    );
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
        `2b. (RngAuction) ${chainName(relay.chainId)} Expected Reward:`,
        `${relay.context.rngExpectedReward.toString()} ${relay.context.rewardToken.symbol}`,
      );
      console.log(
        chalk.grey(`2c. (RngAuction) ${chainName(relay.chainId)} Expected Reward (USD):`),
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
    printSpacer();
    for (const relay of relays) {
      logStringValue(
        `${chainName(relay.chainId)} PrizePool can start RNG in:`,
        `${(relay.context.prizePoolOpenDrawEndsAt - Math.ceil(Date.now() / 1000)) / 60} minutes`,
      );
      printSpacer();
    }
  }

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`RngRelay Auction States:`));

  printSpacer();
  for (const relay of relays) {
    console.log(chalk.grey(`3. ${chainName(relay.chainId)}:`));

    logStringValue(`3a. Relay Auction open? `, `${checkOrX(relay.context.rngRelayIsAuctionOpen)}`);
    if (relay.context.rngRelayIsAuctionOpen) {
      logBigNumber(
        `3b. Relay Expected Reward:`,
        relay.context.rngRelayExpectedReward.toString(),
        relay.context.rewardToken.decimals,
        relay.context.rewardToken.symbol,
      );
      console.log(
        chalk.grey(`3c. Relay Expected Reward (USD):`),
        chalk.yellow(`$${roundTwoDecimalPlaces(relay.context.rngRelayExpectedRewardUsd)}`),
        chalk.dim(`$${relay.context.rngRelayExpectedRewardUsd}`),
      );
    }

    logStringValue(`3d. Relay Last Seq. ID:`, `${relay.context.rngRelayLastSequenceId}`);
    printSpacer();
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

const buildRngAuctionRelayerRemoteOwnerOptimismRelayTxParams = (
  messageDispatcherAddress: string,
  remoteOwnerChainId: number,
  remoteOwnerAddress: string,
  remoteRngAuctionRelayListenerAddress: string,
  rewardRecipient: string,
): RngAuctionRelayerRemoteOwnerOptimismRelayTxParams => {
  return {
    messageDispatcherAddress,
    remoteOwnerChainId,
    remoteOwnerAddress,
    remoteRngAuctionRelayListenerAddress,
    rewardRecipient,
    gasLimit: RNG_AUCTION_RELAYER_OPTIMISM_CUSTOM_GAS_LIMIT,
  };
};

const buildRngAuctionRelayerRemoteOwnerArbitrumRelayTxParams = (
  messageDispatcherAddress: string,
  remoteOwnerChainId: number,
  remoteOwnerAddress: string,
  remoteRngAuctionRelayListenerAddress: string,
  rewardRecipient: string,
  refundAddress: string,
  gasLimit: BigNumber,
  maxSubmissionCost: BigNumber,
  gasPriceBid: BigNumber,
): RngAuctionRelayerRemoteOwnerArbitrumRelayTxParams => {
  return {
    messageDispatcherAddress,
    remoteOwnerChainId,
    remoteOwnerAddress,
    remoteRngAuctionRelayListenerAddress,
    rewardRecipient,
    refundAddress,
    gasLimit,
    maxSubmissionCost,
    gasPriceBid,
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

const getRelayTxParams = async (
  relay: Relay,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
): Promise<
  | RngAuctionRelayerRemoteOwnerArbitrumRelayTxParams
  | RngAuctionRelayerRemoteOwnerOptimismRelayTxParams
> => {
  const { chainId, readProvider } = relay;

  let txParams:
    | RngAuctionRelayerRemoteOwnerArbitrumRelayTxParams
    | RngAuctionRelayerRemoteOwnerOptimismRelayTxParams;
  if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    if (chainIsOptimism(chainId)) {
      txParams = buildRngAuctionRelayerRemoteOwnerOptimismRelayTxParams(
        ERC_5164_MESSAGE_DISPATCHER_ADDRESS[chainId],
        relay.chainId,
        relay.contracts.remoteOwnerContract.address,
        relay.contracts.rngRelayAuctionContract.address,
        params.rewardRecipient,
      );
    } else if (chainIsArbitrum(chainId)) {
      const { gasLimit, maxSubmissionCost, gasPriceBid } = await getArbitrumRelayTxParamsVars(
        relay,
        params,
      );

      txParams = buildRngAuctionRelayerRemoteOwnerArbitrumRelayTxParams(
        ERC_5164_MESSAGE_DISPATCHER_ADDRESS[chainId],
        relay.chainId,
        relay.contracts.remoteOwnerContract.address,
        relay.contracts.rngRelayAuctionContract.address,
        params.rewardRecipient,
        params.rngRelayerAddress, // refundAddress
        gasLimit,
        maxSubmissionCost,
        gasPriceBid,
      );
    }
  } else {
    // TODO: Fill this in if/when we have a need for RelayerDirect (where the PrizePool
    // exists on same chain as RNG service)
  }

  return txParams;
};

const getRelayGasCost = async (
  txParams:
    | RngAuctionRelayerRemoteOwnerArbitrumRelayTxParams
    | RngAuctionRelayerRemoteOwnerOptimismRelayTxParams,
  relay: Relay,
  contract: Contract,
  context: DrawAuctionContext,
): Promise<number> => {
  console.log(chalk.blue(`Estimating gas costs ...`));
  printSpacer();

  const { chainId, readProvider } = relay;
  const { nativeTokenMarketRateUsd } = relay.context;

  let estimatedGasLimit: BigNumber;
  let populatedTx: PopulatedTransaction;
  if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    if (chainIsOptimism(chainId)) {
      estimatedGasLimit = await getEstimatedGasLimitOptimismRelayTx(txParams, contract);
      populatedTx = await populateOptimismRelayTx(txParams, contract);
    } else if (chainIsArbitrum(chainId)) {
      estimatedGasLimit = await getEstimatedGasLimitArbitrumRelayTx(txParams, contract);
      populatedTx = await populateArbitrumRelayTx(txParams, contract);
    }
  } else {
    // TODO: Fill this in if/when we have a need for RelayerDirect (where the PrizePool
    // exists on same chain as RNG service)
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

  return gasCostUsd;
};

const sendRelayTransaction = async (
  rngRelayer: Relayer | Wallet,
  txParams:
    | RngAuctionRelayerRemoteOwnerArbitrumRelayTxParams
    | RngAuctionRelayerRemoteOwnerOptimismRelayTxParams,
  relay: Relay,
  contract: Contract,
  context: DrawAuctionContext,
) => {
  const { readProvider } = relay;

  console.log(chalk.yellow(`Submitting transaction:`));

  // const isPrivate = canUseIsPrivate(chainId, params.useFlashbots);
  const isPrivate = false;
  console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
  printSpacer();

  const { gasPrice } = await getGasPrice(readProvider);
  console.log(chalk.green(`Execute RngAuctionRelayerRemoteOwnerOptimism#relay`));
  console.log(chalk.greenBright.bold(`Sending transaction ...`));
  printSpacer();

  let populatedTx: PopulatedTransaction;
  if (context.drawAuctionState === DrawAuctionState.RngRelayBridge) {
    populatedTx = await contract.populateTransaction.relay(...Object.values(txParams));
  } else {
    // TODO: Fill this in if/when we have a need for RelayerDirect (where the PrizePool
    // exists on same chain as RNG service)
  }

  let sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit: 400000,
    gasPrice: gasPrice.add(ONE_GWEI).toString(),
  };

  if (rngRelayer.constructor.name === 'Relayer') {
    sendTransactionArgs.isPrivate = isPrivate;
  }
  const tx = await rngRelayer.sendTransaction(sendTransactionArgs);

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
  rngRelayerAddress: string,
  context: DrawAuctionContext,
  rngAuctionContracts: RngAuctionContracts,
) => {
  printSpacer();
  printSpacer();
  console.log(chalk.blue(`Checking allowance ...`));
  printSpacer();

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
  signer,
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
        rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
        ethers.constants.MaxInt256,
      );
      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
      await tx.wait();

      const newAllowanceResult = await rngFeeTokenContract.allowance(
        rngRelayerAddress,
        rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
      );
      logStringValue('New allowance:', newAllowanceResult.toString());
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

// Gets the correct RngAuctionRelayerRemoteOwner contract from the ContratsBlob
// for the supplied relay chain
const findRngAuctionRelayerRemoteOwnerContract = (
  chainId: number,
  rngAuctionContracts: RngAuctionContracts,
) => {
  console.log('RNG_AUCTION_RELAYER_REMOTE_OWNER_ADDRESS[chainId].toLowerCase()');
  console.log(RNG_AUCTION_RELAYER_REMOTE_OWNER_ADDRESS[chainId].toLowerCase());
  return rngAuctionContracts.rngAuctionRelayerRemoteOwnerContracts.find((contract) => {
    console.log('contract.address.toLowerCase()');
    console.log(contract.address.toLowerCase());

    return (
      RNG_AUCTION_RELAYER_REMOTE_OWNER_ADDRESS[chainId].toLowerCase() ===
      contract.address.toLowerCase()
    );
  });
};

const chainIsOptimism = (chainId: number) =>
  [CHAIN_IDS.optimism, CHAIN_IDS.optimismSepolia, CHAIN_IDS.optimismGoerli].includes(chainId);

const chainIsArbitrum = (chainId: number) =>
  [CHAIN_IDS.arbitrum, CHAIN_IDS.arbitrumSepolia, CHAIN_IDS.arbitrumGoerli].includes(chainId);

const getEstimatedGasLimitOptimismRelayTx = async (
  rngAuctionRelayerRemoteOwnerOptimismRelayTxParams,
  contract,
) => {
  return await getRngAuctionRelayerRemoteOwnerOptimismRelayEstimatedGasLimit(
    contract,
    rngAuctionRelayerRemoteOwnerOptimismRelayTxParams,
  );
};

const getEstimatedGasLimitArbitrumRelayTx = async (
  rngAuctionRelayerRemoteOwnerArbitrumRelayTxParams,
  contract,
) => {
  return await getRngAuctionRelayerRemoteOwnerArbitrumRelayEstimatedGasLimit(
    contract,
    rngAuctionRelayerRemoteOwnerArbitrumRelayTxParams,
  );
};

const populateOptimismRelayTx = async (
  rngAuctionRelayerRemoteOwnerOptimismRelayTxParams,
  contract,
) => {
  return await contract.populateTransaction.relay(
    ...Object.values(rngAuctionRelayerRemoteOwnerOptimismRelayTxParams),
  );
};

const populateArbitrumRelayTx = async (
  rngAuctionRelayerRemoteOwnerArbitrumRelayTxParams,
  contract,
) => {
  return await contract.populateTransaction.relay(
    ...Object.values(rngAuctionRelayerRemoteOwnerArbitrumRelayTxParams),
  );
};
