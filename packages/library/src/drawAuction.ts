import { ethers, BigNumber, Contract, PopulatedTransaction } from 'ethers';
import { Provider } from '@ethersproject/providers';
import {
  ContractsBlob,
  getContract,
  downloadContractsBlob,
} from '@generationsoftware/pt-v5-utils-js';
// import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { Relayer } from 'defender-relay-client';
import { formatUnits } from '@ethersproject/units';
import chalk from 'chalk';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

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
} from './utils';
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';
import { getDrawAuctionContextMulticall } from './utils/getDrawAuctionContextMulticall';
import { ERC20Abi } from './abis/ERC20Abi';

const RNG_AUCTION_KEY = 'RngAuction';
const RNG_RELAY_AUCTION_KEY = 'RngRelayAuction';

const CONTRACTS = {
  [RNG_AUCTION_KEY]: RNG_AUCTION_KEY,
  [RNG_RELAY_AUCTION_KEY]: RNG_RELAY_AUCTION_KEY,
};

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
  // rngRelayAuctionAddress: string;
  rewardRecipient: string;
}

const ERC_5164_MESSAGE_DISPATCHER_ADDRESS = {
  5: '0x81f4056fffa1c1fa870de40bc45c752260e3ad13',
  // erc5164MessageDispatcherAddress,
};

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
  const chainlinkVRFV2DirectRngAuctionHelper = getContract(
    'ChainlinkVRFV2DirectRngAuctionHelper',
    rngChainId,
    rngReadProvider,
    rngContracts,
    version,
  );
  const rngAuctionRelayerRemoteOwner = getContract(
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
    // console.warn(e);
    printSpacer();
    console.log(
      chalk.yellow(
        'No RngAuctionRelayerDirect contract found on the L1 RNG chain, perhaps PrizePool does not exist on this chain?',
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

  return {
    prizePoolContract,
    chainlinkVRFV2DirectRngAuctionHelper,
    remoteOwnerContract,
    rngAuctionContract,
    rngRelayAuctionContract,
    rngAuctionRelayerRemoteOwner,
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
  signer,
): Promise<undefined> {
  const {
    rngChainId,
    relayChainId,
    relayerAddress,
    rewardRecipient,
    rngWriteProvider,
    relayWriteProvider,
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

  // if (!context.rngIsAuctionOpen && !context.rngRelayIsAuctionOpen) {
  //   printAsterisks();
  //   console.log(chalk.yellow(`Currently no Rng or RngRelay auctions to complete. Exiting ...`));
  //   return;
  // }

  printSpacer();
  printAsterisks();

  // #2. Figure out if we need to run startRngRequest on RngAuction or relay on RngRelayAuction contract
  const selectedContract = determineContractToUse(context);

  // #3. If there is an RNG Fee, figure out if the bot can afford it
  await increaseRngFeeAllowance(
    signer,
    rngWriteProvider,
    relayerAddress,
    context,
    auctionContracts,
  );

  // #4. Estimate gas costs
  const gasCostUsd = await getGasCost(
    rngReadProvider,
    selectedContract,
    auctionContracts,
    params,
    context,
  );
  // if (gasCostUsd === 0) {
  //   printAsterisks();
  //   console.log(chalk.red('Gas cost is $0. Unable to determine profitability. Exiting ...'));
  //   return;
  // }

  // #5. Find reward in USD
  const rewardUsd =
    selectedContract === RNG_AUCTION_KEY
      ? context.rngExpectedRewardUsd
      : context.rngRelayExpectedRewardUsd;

  // #6. Decide if profitable or not
  const profitable = await calculateProfit(params, rewardUsd, gasCostUsd, context);

  // #7. Populate transaction
  // if (profitable) {
  // const relayer = selectedContract === RNG_AUCTION_KEY ? rngRelayer : relayRelayer;
  const relayer = rngRelayer;
  // const chainId = selectedContract === RNG_AUCTION_KEY ? rngChainId : relayChainId;

  // const isPrivate = canUseIsPrivate(chainId, params.useFlashbots);
  // console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
  printSpacer();
  const tx = await sendTransaction(relayer, selectedContract, auctionContracts, params);

  // NOTE: This uses a naive method of waiting for the tx since OZ Defender can
  //       re-submit transactions, effectively giving them different tx hashes
  //       It is likely good enough for these types of transactions but could cause
  //       issues if there are a lot of failures or gas price issues
  //       See querying here:
  //       https://github.com/OpenZeppelin/defender-client/tree/master/packages/relay#querying-transactions
  console.log('Waiting on transaction to be confirmed ...');
  const provider = selectedContract === RNG_AUCTION_KEY ? rngReadProvider : relayReadProvider;
  await provider.waitForTransaction(tx.hash);
  console.log('Tx confirmed !');
  // } else {
  //   console.log(
  //     chalk.yellow(`Completing current auction currently not profitable. Will try again soon ...`),
  //   );
  // }
}

/**
 * Figures out how much gas is required to run the ChainlinkVRFV2DirectRngAuctionHelper transferFeeAndStartRngRequest contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getTransferFeeAndStartRngRequestEstimatedGasLimit = async (
  contract: Contract,
  transferFeeAndStartRngRequestTxParams: TransferFeeAndStartRngRequestTxParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    // TODO: ChainlinkVRFV2DirectRngAuctionHelper#transferFeeAndStartRngRequest;
    estimatedGasLimit = await contract.estimateGas.startRngRequest(
      ...Object.values(transferFeeAndStartRngRequestTxParams),
    );
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
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
    // TODO: ChainlinkVRFV2DirectRngAuctionHelper#transferFeeAndStartRngRequest;
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
  console.log(chalk.blue(`2. Calculating profit ...`));

  printAsterisks();
  console.log(chalk.magenta('Profit/Loss (USD):'));
  printSpacer();

  const grossProfitUsd = rewardUsd;
  console.log(chalk.magenta('(Gross Profit) = Reward'));
  const netProfitUsd = grossProfitUsd - gasCostUsd - context.rngFeeUsd;

  if (context.rngFeeTokenIsSet && context.rngFeeUsd > 0) {
    console.log(chalk.magenta('(Net profit) = (Gross Profit - Gas Fees [Max] - RNG Fee)'));
    console.log(
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
          rewardUsd,
        )} - $${roundTwoDecimalPlaces(gasCostUsd)}) - $${roundTwoDecimalPlaces(
          context.rngFeeUsd,
        )})`,
      ),
      chalk.dim(`$${netProfitUsd} = ($${rewardUsd} - $${gasCostUsd} - $${context.rngFeeUsd})`),
    );
  } else {
    console.log(chalk.magenta('(Net profit) = (Gross Profit) - (Gas Fees [Max])'));
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
  console.log(chalk.blue.bold(`1. Tokens:`));

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
    `1c. RNG Fee token:`,
    context.rngFeeTokenIsSet ? context.rngFeeToken.symbol : 'n/a',
  );
  // TODO: Make this like the ones above where it shows the LINK or whatever RngToken market rate USD
  if (context.rngFeeTokenIsSet) {
    logBigNumber(
      `1d. RNG Fee amount:`,
      context.rngFeeAmount,
      context.rngFeeToken.decimals,
      context.rngFeeToken.symbol,
    );
  }

  printSpacer();
  printSpacer();
  console.log(chalk.blue.bold(`2. Rng Auction State:`));

  printSpacer();
  logStringValue(`2a. (RngAuction) Auction open? `, `${checkOrX(context.rngIsAuctionOpen)}`);

  if (context.rngIsAuctionOpen) {
    printSpacer();
    logBigNumber(
      `2b. (RngAuction) Expected Reward:`,
      context.rngExpectedReward.toString(),
      context.rewardToken.decimals,
      context.rewardToken.symbol,
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
  console.log(chalk.blue.bold(`3. RngRelay Auction State:`));

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
  selectedContract: string,
  auctionContracts: AuctionContracts,
  params: DrawAuctionConfigParams,
  context: DrawAuctionContext,
): Promise<number> => {
  let estimatedGasLimit;
  if (selectedContract === RNG_AUCTION_KEY) {
    if (context.rngFeeTokenIsSet) {
      const transferFeeAndStartRngRequestTxParams = buildTransferFeeAndStartRngRequestParams(
        params.rewardRecipient,
      );
      estimatedGasLimit = await getTransferFeeAndStartRngRequestEstimatedGasLimit(
        auctionContracts.rngAuctionContract,
        transferFeeAndStartRngRequestTxParams,
      );
    } else {
      const startRngRequestTxParams = buildStartRngRequestParams(params.rewardRecipient);
      estimatedGasLimit = await getStartRngRequestEstimatedGasLimit(
        auctionContracts.rngAuctionContract,
        startRngRequestTxParams,
      );
    }
  } else {
    const rngAuctionRelayerRemoteOwnerRelayTxParams =
      buildRngAuctionRelayerRemoteOwnerRelayTxParams(
        ERC_5164_MESSAGE_DISPATCHER_ADDRESS[params.rngChainId],
        params.relayChainId,
        auctionContracts.remoteOwnerContract.address,
        auctionContracts.rngRelayAuctionContract.address,
        params.rewardRecipient,
      );
    console.log('rngAuctionRelayerRemoteOwnerRelayTxParams');
    console.log(rngAuctionRelayerRemoteOwnerRelayTxParams);
    estimatedGasLimit = await getRngAuctionRelayerRemoteOwnerRelayEstimatedGasLimit(
      auctionContracts.rngAuctionRelayerRemoteOwner,
      rngAuctionRelayerRemoteOwnerRelayTxParams,
    );
    // const relayTxParams = buildRelayParams(
    //   auctionContracts.rngRelayAuctionContract.address,
    //   params.rewardRecipient,
    // );
    // estimatedGasLimit = await getRelayEstimatedGasLimit(
    //   auctionContracts.rngAuctionRelayerDirect,
    //   relayTxParams,
    // );
  }

  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellow('Estimated gas limit is 0 ...'));
    return 0;
  } else {
    logBigNumber(
      'Estimated gas limit:',
      estimatedGasLimit,
      NETWORK_NATIVE_TOKEN_INFO[params.rngChainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[params.rngChainId].symbol,
    );
  }

  printSpacer();

  logBigNumber(
    'Gas Cost (wei):',
    estimatedGasLimit,
    NETWORK_NATIVE_TOKEN_INFO[params.rngChainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[params.rngChainId].symbol,
  );

  // 3. Convert gas costs to USD
  printSpacer();
  const { maxFeeUsd: gasCostUsd } = await getFeesUsd(
    params.rngChainId,
    estimatedGasLimit,
    context.rngNativeTokenMarketRateUsd,
    readProvider,
  );
  console.log(
    chalk.grey(`Gas Cost (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(gasCostUsd)}`),
    chalk.dim(`$${gasCostUsd}`),
  );

  return gasCostUsd;
};

const determineContractToUse = (context: DrawAuctionContext): string => {
  return CONTRACTS[RNG_RELAY_AUCTION_KEY];
  // return context.rngIsAuctionOpen ? CONTRACTS[RNG_AUCTION_KEY] : CONTRACTS[RNG_RELAY_AUCTION_KEY];
};

const sendTransaction = async (
  relayer: Relayer,
  selectedContract: string,
  auctionContracts: AuctionContracts,
  params: DrawAuctionConfigParams,
) => {
  console.log(chalk.yellow(`Submitting transaction:`));

  let populatedTx: PopulatedTransaction;
  if (selectedContract === RNG_AUCTION_KEY) {
    console.log(
      chalk.green(`Execute chainlinkVRFV2DirectRngAuctionHelper#transferFeeAndStartRngRequest`),
    );
    printSpacer();

    const startRngRequestTxParams = buildStartRngRequestParams(params.rewardRecipient);
    const chainlinkRngAuctionHelper = auctionContracts.chainlinkVRFV2DirectRngAuctionHelper;
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
    populatedTx = await auctionContracts.rngAuctionRelayerRemoteOwner.populateTransaction.relay(
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

  console.log(chalk.greenBright.bold(`Sending transaction ...`));
  const tx = await relayer.sendTransaction({
    // isPrivate, // omitted until we split these up into separate bots
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit: 8000000,
  });

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

  return tx;
};

const increaseRngFeeAllowance = async (
  signer,
  writeProvider: Provider | DefenderRelaySigner,
  relayerAddress: string,
  context: DrawAuctionContext,
  auctionContracts: AuctionContracts,
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
    approve(signer, writeProvider, relayerAddress, context, auctionContracts);
  }
};

/**
 * Allowance - Give permission to the RngAuctionHelper contract to spend our Relayer/Bot's
 * RNG Fee Token (likely LINK). We will set allowance to max as we trust the security of the
 * RngAuctionHelper contract (you may want to change this!)
 * @returns {undefined} - void function
 */
const approve = async (
  signer,
  writeProvider: Provider | DefenderRelaySigner,
  relayerAddress: string,
  context: DrawAuctionContext,
  auctionContracts: AuctionContracts,
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
        auctionContracts.chainlinkVRFV2DirectRngAuctionHelper.address,
        ethers.constants.MaxInt256,
      );
      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));
      await tx.wait();

      const newAllowanceResult = await rngFeeTokenContract.allowance(
        relayerAddress,
        auctionContracts.chainlinkVRFV2DirectRngAuctionHelper.address,
      );
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
