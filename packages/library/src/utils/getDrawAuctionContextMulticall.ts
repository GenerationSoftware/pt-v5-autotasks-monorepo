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
import { printSpacer } from './logging';
// import { CHAIN_GAS_PRICE_MULTIPLIERS } from '../constants/multipliers';

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

// const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Combines the two DrawAuction Multicalls, one for the RNG Chain and one for the Relay/PrizePool chain
 *
 * @param chainId chain ID that starts the RNG Request
 * @param provider provider for the RNG chain that will be queried
 * @param rngAuctionContracts RngAuctionContracts, a collection of ethers contracts to use for querying
 * @param relayerAddress the bot's address
 * @param rewardRecipient the account which will receive rewards for submitting RNG requests and finishing auctions
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns DrawAuctionContext
 */
export const getDrawAuctionContextMulticall = async (
  chainId: number,
  provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  relayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Gathering info on state of auctions ...`));
  const context: DrawAuctionContext = await getContext(
    chainId,
    provider,
    rngAuctionContracts,
    relayerAddress,
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
  relayerAddress: string,
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
    relayerAddress,
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
  relayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

  let queriesOne: Record<string, any> = {};

  // 1. Queries One: Draw Manager
  queriesOne[DRAW_MANAGER_CAN_START_DRAW_KEY] =
    rngAuctionContracts.drawManagerContract.canStartDraw();
  queriesOne[DRAW_MANAGER_START_DRAW_FEE_KEY] =
    rngAuctionContracts.drawManagerContract.startDrawFee();

  queriesOne[DRAW_MANAGER_CAN_AWARD_DRAW_KEY] =
    rngAuctionContracts.drawManagerContract.canAwardDraw();
  queriesOne[DRAW_MANAGER_AWARD_DRAW_FEE_KEY] =
    rngAuctionContracts.drawManagerContract.awardDrawFee();

  // 2. Queries One: Rng Witnet
  const { gasPrice } = await getGasPrice(provider);
  queriesOne[RNG_WITNET_ESTIMATE_RANDOMIZE_FEE_KEY] =
    rngAuctionContracts.rngWitnetContract.estimateRandomizeFee(gasPrice);

  // 3. Queries One: Prize Pool Info
  queriesOne[PRIZE_POOL_OPEN_DRAW_ID_KEY] = rngAuctionContracts.prizePoolContract.getOpenDrawId();
  queriesOne[PRIZE_POOL_RESERVE_KEY] = rngAuctionContracts.prizePoolContract.reserve();
  queriesOne[PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY] =
    rngAuctionContracts.prizePoolContract.pendingReserveContributions();
  queriesOne[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY] =
    rngAuctionContracts.prizePoolContract.prizeToken();

  // 4. Get and process results
  const resultsOne = await getEthersMulticallProviderResults(multicallProvider, queriesOne);
  console.log('resultsOne');
  console.log(resultsOne);

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
    rngAuctionContracts.prizePoolContract.drawClosesAt(drawId);

  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, provider);

  queriesTwo[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queriesTwo[REWARD_NAME_KEY] = rewardTokenContract.name();
  queriesTwo[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  // const prizePoolReserve = resultsTwo[PRIZE_POOL_RESERVE_KEY];
  // const prizePoolPendingReserveContributions =
  //   resultsTwo[PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY];
  // const reserveTotal = prizePoolReserve.add(prizePoolPendingReserveContributions);

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
  console.log('rewardToken');
  console.log(rewardToken);

  // 10. Results Two: Draw Manager
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

  return {
    canStartDraw,
    startDrawFee,
    startDrawFeeUsd,

    canAwardDraw,
    awardDrawFee,
    awardDrawFeeUsd,

    rngFeeEstimate,

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
