import { ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import { AuctionContracts, DrawAuctionContext, TokenWithRate } from '../types';
import { getGasTokenMarketRateUsd } from './getUsd';
import { ERC20Abi } from '../abis/ERC20Abi';

const { MulticallWrapper } = ethersMulticallProviderPkg;

const REWARD_DECIMALS_KEY = 'reward-decimals';
const REWARD_NAME_KEY = 'reward-name';
const REWARD_SYMBOL_KEY = 'reward-symbol';
const RNG_IS_AUCTION_COMPLETE = 'rng-isAuctionOpen';
const RNG_CURRENT_REWARD_PORTION_KEY = 'rng-currentRewardPortion';
const DRAW_IS_AUCTION_COMPLETE = 'draw-isAuctionOpen';
const DRAW_CURRENT_REWARD_PORTION_KEY = 'draw-currentRewardPortion';
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

  // 1. Info about the reward token (prize token)
  const rewardTokenAddress = await auctionContracts.prizePoolContract.prizeToken();
  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, readProvider);

  queries[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queries[REWARD_NAME_KEY] = rewardTokenContract.name();
  queries[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  queries[`${PRICE_FEED_PREFIX_KEY}-${rewardTokenAddress}`] =
    auctionContracts.marketRateContract.priceFeed(rewardTokenAddress, 'USD');

  // 2. Native token (gas token) market rate in USD
  const gasTokenMarketRateUsd = await getGasTokenMarketRateUsd(auctionContracts.marketRateContract);

  // // 3. Auction info
  // 3a. RNG Auction
  queries[RNG_IS_AUCTION_COMPLETE] = auctionContracts.rngAuctionContract.isAuctionComplete();
  queries[RNG_CURRENT_REWARD_PORTION_KEY] =
    auctionContracts.rngAuctionContract.currentRewardPortion();

  // 3b. Draw Auction
  queries[DRAW_IS_AUCTION_COMPLETE] = auctionContracts.drawAuctionContract.isAuctionComplete();
  queries[DRAW_CURRENT_REWARD_PORTION_KEY] =
    auctionContracts.drawAuctionContract.currentRewardPortion();

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
  const rngIsAuctionComplete = results[RNG_IS_AUCTION_COMPLETE];
  const rngCurrentRewardPortion = results[RNG_CURRENT_REWARD_PORTION_KEY];

  const drawIsAuctionComplete = results[DRAW_IS_AUCTION_COMPLETE];
  const drawCurrentRewardPortion = results[DRAW_CURRENT_REWARD_PORTION_KEY];

  // 5c. Reward
  // rng
  console.log('rngCurrentRewardPortion');
  console.log(rngCurrentRewardPortion);
  console.log(rngCurrentRewardPortion.toString());

  const rngRewardUsd =
    parseFloat(formatUnits(rngCurrentRewardPortion, rewardToken.decimals)) *
    rewardToken.assetRateUsd;

  console.log('rngRewardUsd');
  console.log(rngRewardUsd);

  // draw
  console.log('drawCurrentRewardPortion');
  console.log(drawCurrentRewardPortion);
  console.log(drawCurrentRewardPortion.toString());

  const drawRewardUsd =
    parseFloat(formatUnits(drawCurrentRewardPortion, rewardToken.decimals)) *
    rewardToken.assetRateUsd;

  console.log('drawRewardUsd');
  console.log(drawRewardUsd);

  return {
    rewardToken,
    gasTokenMarketRateUsd,
    rngIsAuctionComplete,
    rngCurrentRewardPortion,
    drawIsAuctionComplete,
    drawCurrentRewardPortion,
    rngRewardUsd,
    drawRewardUsd,
  };
};
