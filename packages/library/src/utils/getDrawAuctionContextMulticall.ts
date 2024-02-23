import { BigNumber, ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import {
  RngAuctionContracts,
  DrawAuctionContext,
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
  Start = 'Start',
  Award = 'Award',
  Idle = 'Idle',
}

const PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY = 'prizePool-prizeTokenAddress';
const PRIZE_POOL_DRAW_CLOSES_AT_KEY = 'prizePool-drawClosesAt';
const PRIZE_POOL_OPEN_DRAW_ID_KEY = 'prizePool-openDrawId';
const PRIZE_POOL_RESERVE_KEY = 'prizePool-reserve';
const PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY = 'prizePool-pendingReserveContributions';

const DRAW_MANAGER_CAN_START_DRAW_KEY = 'drawManager-canStartDraw';
const DRAW_MANAGER_START_DRAW_FEE_KEY = 'drawManager-startDrawFee';

const DRAW_MANAGER_CAN_AWARD_DRAW_KEY = 'drawManager-canAwardDraw';
const DRAW_MANAGER_AWARD_DRAW_FEE_KEY = 'drawManager-awardDrawFee';

const REWARD_DECIMALS_KEY = 'rewardToken-decimals';
const REWARD_NAME_KEY = 'rewardToken-name';
const REWARD_SYMBOL_KEY = 'rewardToken-symbol';

// const RELAY_AUCTION_CLOSES_SOON_PERCENT_THRESHOLD = 10; // 10% or less time left on relay auction

// const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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

  return {
    ...rngContext,
    nativeTokenMarketRateUsd,
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

  // 1. Draw Manager
  queries[DRAW_MANAGER_CAN_START_DRAW_KEY] = rngAuctionContracts.drawManagerContract.canStartDraw();
  queries[DRAW_MANAGER_START_DRAW_FEE_KEY] = rngAuctionContracts.drawManagerContract.startDrawFee();

  queries[DRAW_MANAGER_CAN_AWARD_DRAW_KEY] = rngAuctionContracts.drawManagerContract.canAwardDraw();
  queries[DRAW_MANAGER_AWARD_DRAW_FEE_KEY] = rngAuctionContracts.drawManagerContract.awardDrawFee();

  // 2. Get and process results
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  console.log('results');
  console.log(results);
  const canStartDraw = results[DRAW_MANAGER_CAN_START_DRAW_KEY];
  const startDrawFee = results[DRAW_MANAGER_START_DRAW_FEE_KEY];

  const canAwardDraw = results[DRAW_MANAGER_CAN_AWARD_DRAW_KEY];
  const awardDrawFee = results[DRAW_MANAGER_AWARD_DRAW_FEE_KEY];

  let queriesTwo: Record<string, any> = {};

  // 1. Prize Pool Info
  queriesTwo[PRIZE_POOL_OPEN_DRAW_ID_KEY] = rngAuctionContracts.prizePoolContract.getOpenDrawId();
  queriesTwo[PRIZE_POOL_RESERVE_KEY] = rngAuctionContracts.prizePoolContract.reserve();
  queriesTwo[PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY] =
    rngAuctionContracts.prizePoolContract.pendingReserveContributions();
  queriesTwo[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY] =
    rngAuctionContracts.prizePoolContract.prizeToken();

  // 4. Get and process first set of results
  const resultsOne = await getEthersMulticallProviderResults(multicallProvider, queriesTwo);

  // 5. Start second set of multicalls
  let queriesThree: Record<string, any> = {};

  // 6. Results One: Prize Pool
  const drawId = resultsOne[PRIZE_POOL_OPEN_DRAW_ID_KEY];
  queriesThree[PRIZE_POOL_DRAW_CLOSES_AT_KEY] =
    rngAuctionContracts.prizePoolContract.drawClosesAt(drawId);

  // const auctionDuration = resultsOne[RNG_AUCTION_AUCTION_DURATION_KEY];

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

  // 8. Results One: Reward Token
  const rewardTokenAddress = resultsOne[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY];
  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, provider);

  queriesThree[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queriesThree[REWARD_NAME_KEY] = rewardTokenContract.name();
  queriesThree[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  // 9. Results: Rng Reward
  // const rngRelayLastSequenceId = resultsOne[RNG_AUCTION_LAST_SEQUENCE_ID_KEY];

  // const prizePoolReserve = resultsOne[PRIZE_POOL_RESERVE_KEY];
  // const prizePoolPendingReserveContributions =
  //   resultsOne[PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY];
  // const reserveTotal = prizePoolReserve.add(prizePoolPendingReserveContributions);

  // 10. Get second set of multicall results
  const resultsTwo = await getEthersMulticallProviderResults(multicallProvider, queriesTwo);

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
  const startDrawFeeStr = ethers.utils.formatUnits(startDrawFee, rewardToken.decimals);
  console.log('startDrawFee.toString()');
  console.log(startDrawFee.toString());
  console.log('startDrawFeeStr');
  console.log(startDrawFeeStr);
  // const startDrawFeeUsd = Number(startDrawFee.toString()) * rewardToken.assetRateUsd;
  const startDrawFeeUsd = Number(startDrawFeeStr) * rewardToken.assetRateUsd;
  console.log('startDrawFeeUsd');
  console.log(startDrawFeeUsd);

  const awardDrawFeeStr = ethers.utils.formatUnits(awardDrawFee, rewardToken.decimals);
  console.log('awardDrawFee.toString()');
  console.log(awardDrawFee.toString());
  console.log('awardDrawFeeStr');
  console.log(awardDrawFeeStr);
  // const awardDrawFeeUsd = Number(awardDrawFee.toString()) * rewardToken.assetRateUsd;
  const awardDrawFeeUsd = Number(awardDrawFeeStr) * rewardToken.assetRateUsd;
  console.log('awardDrawFeeUsd');
  console.log(awardDrawFeeUsd);

  const prizePoolDrawClosesAt = Number(resultsTwo[PRIZE_POOL_DRAW_CLOSES_AT_KEY]);

  return {
    canStartDraw,
    startDrawFee,
    startDrawFeeUsd,

    canAwardDraw,
    awardDrawFee,
    awardDrawFeeUsd,

    rewardToken,
    prizePoolDrawClosesAt,
    // auctionClosesSoon,
  };
};

const getDrawAuctionState = (context: DrawAuctionContext): DrawAuctionState => {
  if (context.canStartDraw) {
    return DrawAuctionState.Start;
  } else if (context.canAwardDraw) {
    return DrawAuctionState.Award;
  } else {
    return DrawAuctionState.Idle;
  }
};
