import { BigNumber, ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import {
  RngAuctionContracts,
  DrawAuctionContext,
  DrawAuctionRelayerContext,
  TokenWithRate,
  RngResults,
  AuctionResult,
} from '../types';
import { chainName } from './network';
import {
  getGasPrice,
  getEthMainnetTokenMarketRateUsd,
  getNativeTokenMarketRateUsd,
} from './getUsd';
import { ERC20Abi } from '../abis/ERC20Abi';
import { VrfRngAbi } from '../abis/VrfRngAbi';
import { printSpacer } from './logging';
import { CHAIN_GAS_PRICE_MULTIPLIERS } from '../constants/multipliers';

const { MulticallWrapper } = ethersMulticallProviderPkg;

export enum DrawAuctionState {
  RngStart = 'RngStart',
  Relay = 'Relay',
}

const PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY = 'prizePool-prizeTokenAddress';
const PRIZE_POOL_DRAW_CLOSES_AT_KEY = 'prizePool-drawClosesAt';
const PRIZE_POOL_OPEN_DRAW_ID_KEY = 'prizePool-openDrawId';
const PRIZE_POOL_RESERVE_KEY = 'prizePool-reserve';
const PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY = 'prizePool-pendingReserveContributions';

const RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY =
  'rngAuctionHelper-allowanceBotRngFeeToken';
const RNG_AUCTION_HELPER_ESTIMATE_REQUEST_FEE = 'rngAuctionHelper-estimateRequestFee';

const RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY = 'rngFeeToken-balanceOfBot';
const RNG_FEE_TOKEN_DECIMALS_KEY = 'rngFeeToken-decimals';
const RNG_FEE_TOKEN_NAME_KEY = 'rngFeeToken-name';
const RNG_FEE_TOKEN_SYMBOL_KEY = 'rngFeeToken-symbol';

const REWARD_DECIMALS_KEY = 'rewardToken-decimals';
const REWARD_NAME_KEY = 'rewardToken-name';
const REWARD_SYMBOL_KEY = 'rewardToken-symbol';

const RNG_AUCTION_LAST_AUCTION_RESULT_KEY = 'rng-lastAuctionResultKey';
const RNG_AUCTION_IS_AUCTION_OPEN_KEY = 'rng-isAuctionOpen';
const RNG_AUCTION_CURRENT_FRACTIONAL_REWARD_KEY = 'rng-currentFractionalReward';
const RNG_AUCTION_LAST_SEQUENCE_ID_KEY = 'rngAuction-lastSequenceId';
const RNG_AUCTION_GET_RNG_RESULTS_KEY = 'rngAuction-getRngResults';
const RNG_AUCTION_AUCTION_DURATION_KEY = 'rngAuction-auctionDuration';

const RNG_RELAY_IS_SEQUENCE_COMPLETED_KEY = 'rngRelayAuction-isSequenceCompleted';

const RELAY_AUCTION_CLOSES_SOON_PERCENT_THRESHOLD = 10; // 10% or less time left on relay auction

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Combines the two DrawAuction Multicalls, one for the RNG Chain and one for the Relay/PrizePool chain
 *
 * @param chainId chain ID that starts the RNG Request
 * @param provider provider for the RNG chain that will be queried
 * @param rngAuctionContracts RngAuctionContracts, a collection of ethers contracts to use for querying
 * @param rngRelayerAddress the bot's address
 * @param rewardRecipient the account which will receive rewards for submitting RNG requests and finishing auctions
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns DrawAuctionContext
 */
export const getDrawAuctionContextMulticall = async (
  chainId: number,
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  rngRelayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Gathering info on state of auctions ...`));
  const context: DrawAuctionContext = await getContext(
    chainId,
    provider,
    rngAuctionContracts,
    rngRelayerAddress,
    rewardRecipient,
    covalentApiKey,
  );

  // 5. State enum
  const drawAuctionState: DrawAuctionState = getDrawAuctionState(context);

  return {
    ...context,
    drawAuctionState,
  };
};

const getContext = async (
  chainId: number,
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  rngRelayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Running get RNG multicall ...`));

  // 2. Rng Info
  const rngContext = await getRngMulticall(
    provider,
    chainId,
    rngAuctionContracts,
    rngRelayerAddress,
    rewardRecipient,
    covalentApiKey,
  );

  console.log(chalk.dim(`Getting RNG token and native (gas) token market rates ...`));

  // 3. Native tokens (gas tokens) market rates in USD
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  // 4. Fees & Rewards
  let rngExpectedRewardTotalUsd = 0;
  const relayChainExpectedRewardUsd =
    rngContext.rngExpectedReward * rngContext.rewardToken.assetRateUsd;
  rngExpectedRewardTotalUsd += relayChainExpectedRewardUsd;

  return {
    ...rngContext,
    nativeTokenMarketRateUsd,
    rngExpectedRewardTotalUsd,
  };
};

/**
 * Gather information about the RNG Start Contracts
 *
 * @param provider provider for the chain that will be queried
 * @param rngAuctionContracts rngAuctionContracts, a collection of ethers contracts to use for querying
 * @returns DrawAuctionContext
 */
export const getRngMulticall = async (
  provider: Provider,
  chainId: number,
  rngAuctionContracts: RngAuctionContracts,
  rngRelayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

  let queries: Record<string, any> = {};

  // 1. RNG Auction Service / Fee Token Info
  const rngService = await rngAuctionContracts.rngAuctionContract.getNextRngService();
  const rngServiceContract = new ethers.Contract(rngService, VrfRngAbi, provider);
  const rngServiceRequestFee = await rngServiceContract.getRequestFee();
  const rngFeeTokenAddress = rngServiceRequestFee[0];

  // 2. RNG Estimated Fee
  const rngFeeTokenIsSet = rngFeeTokenAddress !== ZERO_ADDRESS;
  if (rngFeeTokenIsSet) {
    const rngFeeTokenContract = new ethers.Contract(rngFeeTokenAddress, ERC20Abi, provider);
    queries[RNG_FEE_TOKEN_DECIMALS_KEY] = rngFeeTokenContract.decimals();
    queries[RNG_FEE_TOKEN_NAME_KEY] = rngFeeTokenContract.name();
    queries[RNG_FEE_TOKEN_SYMBOL_KEY] = rngFeeTokenContract.symbol();

    queries[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY] = rngFeeTokenContract.balanceOf(rngRelayerAddress);

    queries[RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY] = rngFeeTokenContract.allowance(
      rngRelayerAddress,
      rngAuctionContracts.rngRelayAuctionContract.address, // might need to be RngRelayDirect contract!
    );
  }

  // 3. RNG Auction
  queries[RNG_AUCTION_IS_AUCTION_OPEN_KEY] = rngAuctionContracts.rngAuctionContract.isAuctionOpen();
  queries[RNG_AUCTION_CURRENT_FRACTIONAL_REWARD_KEY] =
    rngAuctionContracts.rngAuctionContract.currentFractionalReward();

  let rngIsRngComplete = false;
  try {
    rngIsRngComplete = await rngAuctionContracts.rngAuctionContract.isRngComplete();
  } catch (e) {
    console.log('');
    console.log(chalk.yellow('Caught isRngComplete exception:'));
    console.log(chalk.yellow(e));
    console.log('');
  }

  // -------------------------------

  //
  // 4. Get and process results
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 5. Results: RNG Auction Service Info
  let rngFeeTokenMarketRateUsd;
  let rngFeeToken: TokenWithRate;
  if (rngFeeTokenIsSet) {
    rngFeeTokenMarketRateUsd = await getEthMainnetTokenMarketRateUsd(
      results[RNG_FEE_TOKEN_SYMBOL_KEY],
      rngFeeTokenAddress,
      covalentApiKey,
    );
    rngFeeToken = {
      address: rngFeeTokenAddress,
      decimals: results[RNG_FEE_TOKEN_DECIMALS_KEY],
      name: results[RNG_FEE_TOKEN_NAME_KEY],
      symbol: results[RNG_FEE_TOKEN_SYMBOL_KEY],
      assetRateUsd: rngFeeTokenMarketRateUsd,
    };
  }

  // 6. Results: Auction Info
  const rngIsAuctionOpen = results[RNG_AUCTION_IS_AUCTION_OPEN_KEY];
  const rngCurrentFractionalReward = results[RNG_AUCTION_CURRENT_FRACTIONAL_REWARD_KEY];
  const rngCurrentFractionalRewardString = ethers.utils.formatEther(rngCurrentFractionalReward);

  // 7. Results: Rng Fee
  // const chainlinkVRFV2DirectRngAuctionHelperContract =
  //   rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract;
  let rngFeeAmount;
  let rngRelayer: DrawAuctionRelayerContext;
  let rngFeeUsd = 0;
  // if (chainlinkVRFV2DirectRngAuctionHelperContract) {
  //   const vrfHelperRequestFee = results[RNG_AUCTION_HELPER_ESTIMATE_REQUEST_FEE];
  //   rngFeeAmount = vrfHelperRequestFee._requestFee;
  //   console.log('rngFeeAmount');
  //   console.log(rngFeeAmount);

  if (rngFeeTokenIsSet) {
    rngRelayer = {
      rngFeeTokenBalance: BigNumber.from(results[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY]),
      rngFeeTokenAllowance: BigNumber.from(
        results[RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY],
      ),
    };

    let chainGasPriceMultiplier = 1;
    if (CHAIN_GAS_PRICE_MULTIPLIERS[chainId]) {
      chainGasPriceMultiplier = CHAIN_GAS_PRICE_MULTIPLIERS[chainId];
    }

    rngFeeUsd =
      parseFloat(formatUnits(rngFeeAmount, rngFeeToken.decimals)) *
      rngFeeToken.assetRateUsd *
      chainGasPriceMultiplier;
  }
  // }

  printSpacer();

  ///////////////////////////////
  // **********************
  console.log(chalk.dim(`Running get Relay multicall ...`));
  console.log(chalk.dim(`Getting state context for chain: ${chainName(chainId)}`));

  let queriesOne: Record<string, any> = {};

  // 1. Prize Pool Info
  queriesOne[PRIZE_POOL_OPEN_DRAW_ID_KEY] = rngAuctionContracts.prizePoolContract.getOpenDrawId();
  queriesOne[PRIZE_POOL_RESERVE_KEY] = rngAuctionContracts.prizePoolContract.reserve();
  queriesOne[PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY] =
    rngAuctionContracts.prizePoolContract.pendingReserveContributions();
  queriesOne[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY] =
    rngAuctionContracts.prizePoolContract.prizeToken();

  // 2. Auction info
  queriesOne[RNG_AUCTION_LAST_SEQUENCE_ID_KEY] =
    rngAuctionContracts.rngAuctionContract.lastSequenceId();

  // queriesOne[RNG_AUCTION_GET_RNG_RESULTS_KEY] =
  //   rngAuctionContracts.rngAuctionContract.callStatic.getRngResults();
  queriesOne[RNG_AUCTION_AUCTION_DURATION_KEY] =
    rngAuctionContracts.rngAuctionContract.auctionDuration();
  queriesOne[RNG_AUCTION_LAST_AUCTION_RESULT_KEY] =
    rngAuctionContracts.rngAuctionContract.getLastAuctionResult();

  // 4. Get and process first set of results
  const resultsOne = await getEthersMulticallProviderResults(multicallProvider, queriesOne);

  // 5. Start second set of multicalls
  let queriesTwo: Record<string, any> = {};

  // 6. Results One: Prize Pool
  const drawId = resultsOne[PRIZE_POOL_OPEN_DRAW_ID_KEY];
  queriesTwo[PRIZE_POOL_DRAW_CLOSES_AT_KEY] =
    rngAuctionContracts.prizePoolContract.drawClosesAt(drawId);

  // 7. Results One: Auction info
  let randomNumber, rngCompletedAt;
  try {
    const rngResults = await rngAuctionContracts.rngAuctionContract.callStatic.getRngResults();
    randomNumber = rngResults[0];
    rngCompletedAt = rngResults[1];
  } catch (e) {
    console.log('');
    console.log(chalk.yellow('Caught getRngResults() exception:'));
    console.log(chalk.yellow(e));
    console.log('');
  }
  // const [randomNumber, rngCompletedAt] =
  //   await rngAuctionContracts.rngAuctionContract.callStatic.getRngResults();
  // const [randomNumber, rngCompletedAt] = resultsOne[RNG_AUCTION_GET_RNG_RESULTS_KEY];
  const rngResults: RngResults = { randomNumber, rngCompletedAt };
  let rngLastAuctionResult: AuctionResult = resultsOne[RNG_AUCTION_LAST_AUCTION_RESULT_KEY];
  const auctionDuration = resultsOne[RNG_AUCTION_AUCTION_DURATION_KEY];

  let auctionExpired, auctionClosesSoon, elapsedTime;
  if (rngResults.rngCompletedAt) {
    elapsedTime = Math.floor(Date.now() / 1000) - Number(rngResults.rngCompletedAt.toString());

    if (elapsedTime > auctionDuration) {
      auctionExpired = true;
      elapsedTime = auctionDuration;
    }

    // Store if this relay auction is coming to an end
    const percentRemaining = ((auctionDuration - elapsedTime) / auctionDuration) * 100;
    auctionClosesSoon =
      percentRemaining > 0 && percentRemaining < RELAY_AUCTION_CLOSES_SOON_PERCENT_THRESHOLD;
  }
  console.log('auctionExpired');
  console.log(auctionExpired);
  console.log('auctionClosesSoon');
  console.log(auctionClosesSoon);

  // 8. Results One: Reward Token
  const rewardTokenAddress = resultsOne[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY];
  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, provider);

  queriesTwo[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queriesTwo[REWARD_NAME_KEY] = rewardTokenContract.name();
  queriesTwo[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  // 9. Results: Rng Reward
  const rngRelayLastSequenceId = resultsOne[RNG_AUCTION_LAST_SEQUENCE_ID_KEY];

  const prizePoolReserve = resultsOne[PRIZE_POOL_RESERVE_KEY];
  const prizePoolPendingReserveContributions =
    resultsOne[PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY];
  const reserveTotal = prizePoolReserve.add(prizePoolPendingReserveContributions);

  queriesTwo[RNG_RELAY_IS_SEQUENCE_COMPLETED_KEY] =
    rngAuctionContracts.rngRelayAuctionContract.isSequenceCompleted(rngRelayLastSequenceId);

  // 10. Get second set of multicall results
  const resultsTwo = await getEthersMulticallProviderResults(multicallProvider, queriesTwo);

  // 11. Results two: Auction Info
  const lastSequenceCompleted = resultsTwo[RNG_RELAY_IS_SEQUENCE_COMPLETED_KEY];

  const rngRelayIsAuctionOpen =
    rngRelayLastSequenceId > 0 && rngIsRngComplete && !lastSequenceCompleted && !auctionExpired;

  // 12. Results two: Reward token
  const rewardTokenMarketRateUsd = await getEthMainnetTokenMarketRateUsd(
    resultsTwo[REWARD_SYMBOL_KEY],
    rewardTokenAddress,
    covalentApiKey,
  );
  const rewardToken: TokenWithRate = {
    address: rewardTokenAddress,
    decimals: resultsTwo[REWARD_DECIMALS_KEY],
    name: resultsTwo[REWARD_NAME_KEY],
    symbol: resultsTwo[REWARD_SYMBOL_KEY],
    assetRateUsd: rewardTokenMarketRateUsd,
  };

  // 13. Results two: Auction info
  const reserveTotalStr = ethers.utils.formatUnits(reserveTotal, rewardToken.decimals);
  const rngExpectedReward = Number(reserveTotalStr) * Number(rngCurrentFractionalRewardString);
  const rngExpectedRewardUsd = rngExpectedReward * rewardToken.assetRateUsd;

  const prizePoolDrawClosesAt = Number(resultsTwo[PRIZE_POOL_DRAW_CLOSES_AT_KEY]);

  // 14. Results: Draw/Relayer Reward
  let rngRelayExpectedReward, rngRelayExpectedRewardUsd;
  if (rngRelayIsAuctionOpen) {
    const rngRelayRewardFraction =
      await rngAuctionContracts.rngRelayAuctionContract.computeRewardFraction(elapsedTime);

    // Make a new AuctionResult based off the data we currently know (we assume
    // we will be the recipient, and we have the estimated RelayRewardFraction)
    const auctionResult = {
      rewardFraction: rngRelayRewardFraction,
      recipient: rewardRecipient,
    };

    const auctionResults = [];
    auctionResults[0] = rngLastAuctionResult;
    auctionResults[1] = auctionResult;

    const rngRelayExpectedRewardResult =
      await rngAuctionContracts.rngRelayAuctionContract.callStatic.computeRewards(auctionResults);
    rngRelayExpectedReward = rngRelayExpectedRewardResult[1];

    rngRelayExpectedRewardUsd =
      parseFloat(formatUnits(rngRelayExpectedReward.toString(), rewardToken.decimals)) *
      rewardToken.assetRateUsd;
  }

  return {
    rngFeeTokenIsSet,
    rngFeeToken,
    rngFeeAmount,
    rngFeeUsd,
    rngIsAuctionOpen,
    rngIsRngComplete,
    rngCurrentFractionalRewardString,
    rngRelayer,
    prizePoolDrawClosesAt,
    auctionClosesSoon,
    rngResults,
    rngLastAuctionResult,
    rngExpectedReward,
    rngExpectedRewardUsd,
    rewardToken,
    rngRelayIsAuctionOpen,
    rngRelayExpectedReward,
    rngRelayExpectedRewardUsd,
    rngRelayLastSequenceId,
  };
};

// If in RNG Start state figure out if we need to run:
//   RngAuction#startRngRequest
//
// If in relay state:
//   RngRelayAuction#relay (if blockhash)
const getDrawAuctionState = (context: DrawAuctionContext): DrawAuctionState => {
  // if (context.rngIsAuctionOpen && context.rngFeeTokenIsSet && context.rngFeeUsd > 0) {

  if (context.rngIsAuctionOpen) {
    return DrawAuctionState.RngStart;
  } else {
    return DrawAuctionState.Relay;
  }
};
