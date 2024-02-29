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

const PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY = 'prizePool-prizeTokenAddress';
const PRIZE_POOL_DRAW_CLOSES_AT_KEY = 'prizePool-drawClosesAt';
const PRIZE_POOL_OPEN_DRAW_ID_KEY = 'prizePool-openDrawId';
const PRIZE_POOL_RESERVE_KEY = 'prizePool-reserve';
const PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY = 'prizePool-pendingReserveContributions';

const RNG_WITNET_ESTIMATE_RANDOMIZE_FEE_KEY = 'rngWitnet-estimateRandomizeFee';

const DRAW_MANAGER_CAN_START_DRAW_KEY = 'drawManager-canStartDraw';
const DRAW_MANAGER_START_DRAW_FEE_KEY = 'drawManager-startDrawFee';

const DRAW_MANAGER_CAN_AWARD_DRAW_KEY = 'drawManager-canAwardDraw';
const DRAW_MANAGER_AWARD_DRAW_FEE_KEY = 'drawManager-awardDrawFee';

const REWARD_DECIMALS_KEY = 'rewardToken-decimals';
const REWARD_NAME_KEY = 'rewardToken-name';
const REWARD_SYMBOL_KEY = 'rewardToken-symbol';

// const RELAY_AUCTION_CLOSES_SOON_PERCENT_THRESHOLD = 10; // 10% or less time left on relay auction

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

  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

  let queriesOne: Record<string, any> = {};

  // 1. Queries One: Draw Manager
  queriesOne[DRAW_MANAGER_CAN_START_DRAW_KEY] =
    drawAuctionContracts.drawManagerContract.canStartDraw();
  queriesOne[DRAW_MANAGER_START_DRAW_FEE_KEY] =
    drawAuctionContracts.drawManagerContract.startDrawFee();

  queriesOne[DRAW_MANAGER_CAN_AWARD_DRAW_KEY] =
    drawAuctionContracts.drawManagerContract.canAwardDraw();
  queriesOne[DRAW_MANAGER_AWARD_DRAW_FEE_KEY] =
    drawAuctionContracts.drawManagerContract.awardDrawFee();

  // 2. Queries One: Rng Witnet
  const gasPrice = await provider.getGasPrice();
  queriesOne[RNG_WITNET_ESTIMATE_RANDOMIZE_FEE_KEY] =
    drawAuctionContracts.rngWitnetContract.estimateRandomizeFee(gasPrice);

  // 3. Queries One: Prize Pool Info
  queriesOne[PRIZE_POOL_OPEN_DRAW_ID_KEY] = drawAuctionContracts.prizePoolContract.getOpenDrawId();
  queriesOne[PRIZE_POOL_RESERVE_KEY] = drawAuctionContracts.prizePoolContract.reserve();
  queriesOne[PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY] =
    drawAuctionContracts.prizePoolContract.pendingReserveContributions();
  queriesOne[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY] =
    drawAuctionContracts.prizePoolContract.prizeToken();

  // 4. Get and process results
  const resultsOne = await getEthersMulticallProviderResults(multicallProvider, queriesOne);

  // 5. Results One: Draw Manager
  const canStartDraw = resultsOne[DRAW_MANAGER_CAN_START_DRAW_KEY];
  const startDrawFee = resultsOne[DRAW_MANAGER_START_DRAW_FEE_KEY];

  const canAwardDraw = resultsOne[DRAW_MANAGER_CAN_AWARD_DRAW_KEY];
  const awardDrawFee = resultsOne[DRAW_MANAGER_AWARD_DRAW_FEE_KEY];

  // 6. Results One: Rng Witnet
  const rngFeeEstimate = resultsOne[RNG_WITNET_ESTIMATE_RANDOMIZE_FEE_KEY];

  // 7. Results One: Prize Pool
  const drawId = resultsOne[PRIZE_POOL_OPEN_DRAW_ID_KEY];
  const rewardTokenAddress = resultsOne[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY];

  // const auctionDuration = resultsTwo[RNG_AUCTION_AUCTION_DURATION_KEY];

  // let auctionExpired, auctionClosesSoon, elapsedTime;
  // if (rngResults.rngCompletedAt) {
  //   elapsedTime = Math.floor(Date.now() / 1000) - Number(rngResults.rngCompletedAt.toString());

  //   if (elapsedTime > auctionDuration) {
  //     auctionExpired = true;
  //     elapsedTime = auctionDuration;
  //   }

  //   // Store if this relay auction is coming to an end
  //   const percentRemaining = ((auctionDuration - elapsedTime) / auctionDuration) * 100;
  //   auctionClosesSoon =
  //     percentRemaining > 0 && percentRemaining < RELAY_AUCTION_CLOSES_SOON_PERCENT_THRESHOLD;
  // }

  let queriesTwo: Record<string, any> = {};

  // 6. Queries Two: Prize Pool
  queriesTwo[PRIZE_POOL_DRAW_CLOSES_AT_KEY] =
    drawAuctionContracts.prizePoolContract.drawClosesAt(drawId);

  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, provider);

  queriesTwo[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queriesTwo[REWARD_NAME_KEY] = rewardTokenContract.name();
  queriesTwo[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  // 7. Results Two: Get second set of multicall results
  const resultsTwo = await getEthersMulticallProviderResults(multicallProvider, queriesTwo);
  console.log('resultsTwo');
  console.log(resultsTwo);

  // 8. Results Two: PrizePool
  const prizePoolDrawClosesAt = Number(resultsTwo[PRIZE_POOL_DRAW_CLOSES_AT_KEY]);

  // 9. Results Two: Reward token
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

  // 10. Results Two: Draw Manager
  const startDrawFeeStr = ethers.utils.formatUnits(startDrawFee, rewardToken.decimals);
  const startDrawFeeUsd = Number(startDrawFeeStr) * rewardToken.assetRateUsd;

  const awardDrawFeeStr = ethers.utils.formatUnits(awardDrawFee, rewardToken.decimals);
  console.log('awardDrawFee.toString()');
  console.log(awardDrawFee.toString());
  console.log('awardDrawFeeStr');
  console.log(awardDrawFeeStr);
  // const awardDrawFeeUsd = Number(awardDrawFee.toString()) * rewardToken.assetRateUsd;
  const awardDrawFeeUsd = Number(awardDrawFeeStr) * rewardToken.assetRateUsd;
  console.log('awardDrawFeeUsd');
  console.log(awardDrawFeeUsd);

  // Currently Witnet requires the native token ETH on Optimism for RNG Fee
  // assume 18 decimals
  // note: May need to change on different chains that use a unique token for gas (AVAX, etc)
  const rngFeeEstimateStr = ethers.utils.formatEther(rngFeeEstimate);
  const rngFeeEstimateUsd = Number(rngFeeEstimateStr) * nativeTokenMarketRateUsd;

  return {
    canStartDraw,
    startDrawFee,
    startDrawFeeUsd,

    canAwardDraw,
    awardDrawFee,
    awardDrawFeeUsd,

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
  } else if (context.canAwardDraw) {
    return DrawAuctionState.Award;
  } else {
    return DrawAuctionState.Idle;
  }
};
