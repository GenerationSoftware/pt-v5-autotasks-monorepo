import { ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import { AuctionContracts, DrawAuctionContext, TokenWithRate } from '../types';
import { getGasTokenMarketRateUsd } from './getUsd';
import { ERC20Abi } from '../abis/ERC20Abi';
// import { VrfRngAbi } from '../abis/VrfRngAbi';

const { MulticallWrapper } = ethersMulticallProviderPkg;

const REWARD_DECIMALS_KEY = 'reward-decimals';
const REWARD_NAME_KEY = 'reward-name';
const REWARD_SYMBOL_KEY = 'reward-symbol';
const RNG_IS_AUCTION_OPEN = 'rng-isAuctionOpen';
const RNG_EXPECTED_REWARD_KEY = 'rng-currentRewardPortion';
const DRAW_IS_AUCTION_OPEN = 'draw-isAuctionOpen';
const DRAW_EXPECTED_REWARD_KEY = 'draw-currentRewardPortion';
const PRICE_FEED_PREFIX_KEY = 'priceFeed';

/**
 * Gather information about the draw auction, the prize (ie. reserve, reward) token
 *
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param auctionContracts AuctionContracts, a collection of ethers contracts to use for querying
 * @returns DrawAuctionContext
 */
export const getDrawAuctionContextMulticall = async (
  readProvider: Provider,
  auctionContracts: AuctionContracts,
): Promise<DrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(readProvider);

  let queries: Record<string, any> = {};

  // 1. Prize Pool Info
  const prizePoolReserve = auctionContracts.prizePoolContract.reserve();

  // 2. Info about the reward token (prize token)
  const rewardTokenAddress = await auctionContracts.prizePoolContract.prizeToken();
  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, readProvider);

  queries[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queries[REWARD_NAME_KEY] = rewardTokenContract.name();
  queries[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  queries[`${PRICE_FEED_PREFIX_KEY}-${rewardTokenAddress}`] =
    auctionContracts.marketRateContract.priceFeed(rewardTokenAddress, 'USD');

  // 3. Native token (gas token) market rate in USD
  const gasTokenMarketRateUsd = await getGasTokenMarketRateUsd(auctionContracts.marketRateContract);

  // // 4. Auction info
  // 4a. RNG Auction
  queries[RNG_IS_AUCTION_OPEN] = auctionContracts.rngAuctionContract.isAuctionComplete();
  queries[RNG_EXPECTED_REWARD_KEY] =
    auctionContracts.rngAuctionContract.expectedReward(prizePoolReserve);

  // 4b. Draw Auction
  queries[DRAW_IS_AUCTION_OPEN] = auctionContracts.drawAuctionContract.isAuctionComplete();
  queries[DRAW_EXPECTED_REWARD_KEY] =
    auctionContracts.drawAuctionContract.expectedReward(prizePoolReserve);

  // -------------------------------

  //
  // 5. Get and process results
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 5a. Results: Reward Token
  const rewardTokenPriceFeedResults = results[`${PRICE_FEED_PREFIX_KEY}-${rewardTokenAddress}`];
  const rewardToken: TokenWithRate = {
    address: rewardTokenAddress,
    decimals: results[REWARD_DECIMALS_KEY],
    name: results[REWARD_NAME_KEY],
    symbol: results[REWARD_SYMBOL_KEY],
    assetRateUsd: rewardTokenPriceFeedResults,
  };

  // 5b. Results: Auction Info
  const rngIsAuctionComplete = results[RNG_IS_AUCTION_OPEN];
  const rngExpectedReward = results[RNG_EXPECTED_REWARD_KEY];

  const drawIsAuctionComplete = results[DRAW_IS_AUCTION_OPEN];
  const drawExpectedReward = results[DRAW_EXPECTED_REWARD_KEY];

  // 5c. Reward
  // rng
  console.log('rngExpectedReward');
  console.log(rngExpectedReward);
  console.log(rngExpectedReward.toString());

  const rngRewardUsd =
    parseFloat(formatUnits(rngExpectedReward, rewardToken.decimals)) * rewardToken.assetRateUsd;
  console.log('rngRewardUsd');
  console.log(rngRewardUsd);

  // draw
  console.log('drawExpectedReward');
  console.log(drawExpectedReward);
  console.log(drawExpectedReward.toString());

  const drawRewardUsd =
    parseFloat(formatUnits(drawExpectedReward, rewardToken.decimals)) * rewardToken.assetRateUsd;

  console.log('drawRewardUsd');
  console.log(drawRewardUsd);

  return {
    rewardToken,
    gasTokenMarketRateUsd,
    rngIsAuctionComplete,
    rngExpectedReward,
    drawIsAuctionComplete,
    drawExpectedReward,
    rngRewardUsd,
    drawRewardUsd,
    prizePoolReserve,
  };
};
