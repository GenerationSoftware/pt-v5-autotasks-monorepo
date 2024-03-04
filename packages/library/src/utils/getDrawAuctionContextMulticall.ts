import { ethers } from 'ethers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import {
  DrawAuctionContracts,
  DrawAuctionContext,
  TokenWithRate,
  DrawAuctionConfig,
} from '../types';
import { getEthMainnetTokenMarketRateUsd, getNativeTokenMarketRateUsd } from './getUsd';
import { ERC20Abi } from '../abis/ERC20Abi';
import { printSpacer } from './logging';

const { MulticallWrapper } = ethersMulticallProviderPkg;

export enum DrawAuctionState {
  Start = 'Start',
  Award = 'Award',
  Idle = 'Idle',
}

const QUERY_KEYS = {
  PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY: 'prizePool-prizeTokenAddress',
  PRIZE_POOL_DRAW_CLOSES_AT_KEY: 'prizePool-drawClosesAt',
  PRIZE_POOL_OPEN_DRAW_ID_KEY: 'prizePool-openDrawId',
  PRIZE_POOL_RESERVE_KEY: 'prizePool-reserve',
  PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY: 'prizePool-pendingReserveContributions',

  RNG_WITNET_ESTIMATE_RANDOMIZE_FEE_KEY: 'rngWitnet-estimateRandomizeFee',

  DRAW_MANAGER_CAN_START_DRAW_KEY: 'drawManager-canStartDraw',
  DRAW_MANAGER_START_DRAW_REWARD_KEY: 'drawManager-startDrawReward',
  DRAW_MANAGER_CAN_FINISH_DRAW_KEY: 'drawManager-canFinishDraw',
  DRAW_MANAGER_FINISH_DRAW_REWARD_KEY: 'drawManager-finishDrawReward',
  DRAW_MANAGER_AUCTION_DURATION_KEY: 'drawManager-auctionDuration',
  DRAW_MANAGER_ELAPSED_TIME_SINCE_DRAW_CLOSED: 'drawManager-elapsedTimeSinceDrawClosed',

  REWARD_DECIMALS_KEY: 'rewardToken-decimals',
  REWARD_NAME_KEY: 'rewardToken-name',
  REWARD_SYMBOL_KEY: 'rewardToken-symbol',
};

const RELAY_AUCTION_CLOSES_SOON_PERCENT_THRESHOLD = 10; // 10% or less time left on relay auction

/**
 * Combines the DrawAuction Multicall data with the , one for the RNG Chain and one for the Relay/PrizePool chain
 *
 * @param {DrawAuctionConfig} config
 * @param {DrawAuctionContracts} drawAuctionContracts, a collection of ethers contracts to use for querying
 * @returns {Promise<DrawAuctionContext>}
 */
export const getDrawAuctionContextMulticall = async (
  config: DrawAuctionConfig,
  drawAuctionContracts: DrawAuctionContracts,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Gathering info on state of auctions ...`));
  const { chainId } = config;

  // 1. Native tokens (gas tokens) market rates in USD
  console.log(chalk.dim(`Getting RNG token and native (gas) token market rates ...`));
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  // 2. Multicall data
  printSpacer();
  console.log(chalk.dim(`Running draw auction state context multicalls ...`));
  const context = await getContext(config, drawAuctionContracts, nativeTokenMarketRateUsd);

  // 3.
  const drawAuctionState: DrawAuctionState = getDrawAuctionState(context);

  return { ...context, drawAuctionState };
};

const getContext = async (
  config: DrawAuctionConfig,
  drawAuctionContracts: DrawAuctionContracts,
  nativeTokenMarketRateUsd: number,
): Promise<DrawAuctionContext> => {
  const { provider, covalentApiKey } = config;
  const { drawManagerContract, rngWitnetContract, prizePoolContract } = drawAuctionContracts;

  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

  let queriesOne: Record<string, any> = {};

  // 1. Queries One: Draw Manager
  queriesOne[QUERY_KEYS.DRAW_MANAGER_CAN_START_DRAW_KEY] = drawManagerContract.canStartDraw();
  queriesOne[QUERY_KEYS.DRAW_MANAGER_START_DRAW_REWARD_KEY] = drawManagerContract.startDrawReward();

  queriesOne[QUERY_KEYS.DRAW_MANAGER_CAN_FINISH_DRAW_KEY] = drawManagerContract.canFinishDraw();
  queriesOne[QUERY_KEYS.DRAW_MANAGER_FINISH_DRAW_REWARD_KEY] =
    drawManagerContract.finishDrawReward();

  queriesOne[QUERY_KEYS.DRAW_MANAGER_AUCTION_DURATION_KEY] = drawManagerContract.auctionDuration();
  // queriesOne[QUERY_KEYS.DRAW_MANAGER_ELAPSED_TIME_SINCE_DRAW_CLOSED] =
  //   drawManagerContract.elapsedTimeSinceDrawClosed();

  // 2. Queries One: Rng Witnet
  const gasPrice = await provider.getGasPrice();
  queriesOne[QUERY_KEYS.RNG_WITNET_ESTIMATE_RANDOMIZE_FEE_KEY] =
    rngWitnetContract.estimateRandomizeFee(gasPrice);

  // 3. Queries One: Prize Pool Info
  queriesOne[QUERY_KEYS.PRIZE_POOL_OPEN_DRAW_ID_KEY] = prizePoolContract.getOpenDrawId();
  queriesOne[QUERY_KEYS.PRIZE_POOL_RESERVE_KEY] = prizePoolContract.reserve();
  queriesOne[QUERY_KEYS.PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY] =
    prizePoolContract.pendingReserveContributions();
  queriesOne[QUERY_KEYS.PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY] = prizePoolContract.prizeToken();

  // 4. Get and process results
  const resultsOne = await getEthersMulticallProviderResults(multicallProvider, queriesOne);

  // 5. Results One: Draw Manager
  const canStartDraw = resultsOne[QUERY_KEYS.DRAW_MANAGER_CAN_START_DRAW_KEY];
  const startDrawReward = resultsOne[QUERY_KEYS.DRAW_MANAGER_START_DRAW_REWARD_KEY];

  const canFinishDraw = resultsOne[QUERY_KEYS.DRAW_MANAGER_CAN_FINISH_DRAW_KEY];
  const finishDrawReward = resultsOne[QUERY_KEYS.DRAW_MANAGER_FINISH_DRAW_REWARD_KEY];

  const auctionDuration = resultsOne[QUERY_KEYS.DRAW_MANAGER_AUCTION_DURATION_KEY];
  // const elapsedTimeSinceDrawClosed =
  //   resultsOne[QUERY_KEYS.DRAW_MANAGER_ELAPSED_TIME_SINCE_DRAW_CLOSED];

  // let auctionExpired, auctionClosesSoon, elapsedTime;
  // if (canFinishDraw) {
  //   // elapsedTime = Math.floor(Date.now() / 1000) - Number(rngResults.rngCompletedAt.toString());
  //   // this is wrong, should be more like line above:
  //   elapsedTime = elapsedTimeSinceDrawClosed;

  //   if (elapsedTime > auctionDuration) {
  //     auctionExpired = true;
  //     elapsedTime = auctionDuration;
  //   }

  //   // Store if this relay auction is coming to an end
  //   const percentRemaining = ((auctionDuration - elapsedTime) / auctionDuration) * 100;
  //   auctionClosesSoon =
  //     percentRemaining > 0 && percentRemaining < RELAY_AUCTION_CLOSES_SOON_PERCENT_THRESHOLD;
  // }
  // console.log('auctionClosesSoon');
  // console.log(auctionClosesSoon);
  // console.log('auctionExpired');
  // console.log(auctionExpired);

  // 6. Results One: Rng Witnet
  const rngFeeEstimate = resultsOne[QUERY_KEYS.RNG_WITNET_ESTIMATE_RANDOMIZE_FEE_KEY];

  // 7. Results One: Prize Pool
  const drawId = resultsOne[QUERY_KEYS.PRIZE_POOL_OPEN_DRAW_ID_KEY];
  const rewardTokenAddress = resultsOne[QUERY_KEYS.PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY];

  let queriesTwo: Record<string, any> = {};

  // 6. Queries Two: Prize Pool
  queriesTwo[QUERY_KEYS.PRIZE_POOL_DRAW_CLOSES_AT_KEY] = prizePoolContract.drawClosesAt(drawId);

  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, provider);

  queriesTwo[QUERY_KEYS.REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queriesTwo[QUERY_KEYS.REWARD_NAME_KEY] = rewardTokenContract.name();
  queriesTwo[QUERY_KEYS.REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  // 7. Results Two: Get second set of multicall results
  const resultsTwo = await getEthersMulticallProviderResults(multicallProvider, queriesTwo);
  console.log('resultsTwo');
  console.log(resultsTwo);

  // 8. Results Two: PrizePool
  const prizePoolDrawClosesAt = Number(resultsTwo[QUERY_KEYS.PRIZE_POOL_DRAW_CLOSES_AT_KEY]);

  // 9. Results Two: Reward token
  const rewardTokenMarketRateUsd = await getEthMainnetTokenMarketRateUsd(
    resultsTwo[QUERY_KEYS.REWARD_SYMBOL_KEY],
    rewardTokenAddress,
    covalentApiKey,
  );
  const rewardToken: TokenWithRate = {
    address: rewardTokenAddress,
    decimals: resultsTwo[QUERY_KEYS.REWARD_DECIMALS_KEY],
    name: resultsTwo[QUERY_KEYS.REWARD_NAME_KEY],
    symbol: resultsTwo[QUERY_KEYS.REWARD_SYMBOL_KEY],
    assetRateUsd: rewardTokenMarketRateUsd,
  };

  // 10. Results Two: Draw Manager
  const startDrawRewardStr = ethers.utils.formatUnits(startDrawReward, rewardToken.decimals);
  const startDrawRewardUsd = Number(startDrawRewardStr) * rewardToken.assetRateUsd;

  const finishDrawRewardStr = ethers.utils.formatUnits(finishDrawReward, rewardToken.decimals);
  console.log('finishDrawReward.toString()');
  console.log(finishDrawReward.toString());
  const finishDrawRewardUsd = Number(finishDrawRewardStr) * rewardToken.assetRateUsd;
  console.log('finishDrawRewardUsd');
  console.log(finishDrawRewardUsd);

  // Currently Witnet requires the native token ETH on Optimism for RNG Fee
  // assume 18 decimals
  // note: May need to change on different chains that use a unique token for gas (AVAX, etc)
  const rngFeeEstimateStr = ethers.utils.formatEther(rngFeeEstimate);
  const rngFeeEstimateUsd = Number(rngFeeEstimateStr) * nativeTokenMarketRateUsd;

  return {
    canStartDraw,
    startDrawReward,
    startDrawRewardUsd,

    canFinishDraw,
    finishDrawReward,
    finishDrawRewardUsd,

    rngFeeEstimate,
    rngFeeEstimateUsd,

    rewardToken,
    prizePoolDrawClosesAt,
    // auctionClosesSoon,

    nativeTokenMarketRateUsd,
  };
};

/**
 * Determines the state the draw auction is in (Idle, Start, or Award)
 *
 * @param {DrawAuctionContext} context, current state of the draw auction contracts
 *
 * @returns {DrawAuctionState} current state enum
 */
const getDrawAuctionState = (context: DrawAuctionContext): DrawAuctionState => {
  if (context.canStartDraw) {
    return DrawAuctionState.Start;
  } else if (context.canFinishDraw) {
    return DrawAuctionState.Award;
  } else {
    return DrawAuctionState.Idle;
  }
};
