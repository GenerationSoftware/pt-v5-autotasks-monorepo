import { ethers } from 'ethers';
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
const RNG_IS_AUCTION_OPEN_KEY = 'rng-isAuctionOpen';
const RNG_CURRENT_REWARD_PORTION_KEY = 'rng-currentRewardPortion';
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

  // 2. Native token (gas token) market rate in USD
  const gasTokenMarketRateUsd = await getGasTokenMarketRateUsd(auctionContracts.marketRateContract);

  // 3. RNG Auction info
  queries[RNG_IS_AUCTION_OPEN_KEY] = auctionContracts.rngAuctionContract.isRNGAuctionOpen();

  queries[RNG_CURRENT_REWARD_PORTION_KEY] =
    auctionContracts.rngAuctionContract.currentRewardPortion();

  // const currentRewardPortionDraw =
  //   await auctionContracts.drawAuctionContract.currentRewardPortion();

  // 4. Draw Auction info

  // 5. Price Feed
  queries[`${PRICE_FEED_PREFIX_KEY}-${rewardTokenAddress}`] =
    auctionContracts.marketRateContract.priceFeed(rewardTokenAddress, 'USD');

  // 7. Get and process results!
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  const isRngAuctionOpen = results[RNG_IS_AUCTION_OPEN_KEY];
  const currentRewardPortionRng = results[RNG_CURRENT_REWARD_PORTION_KEY];

  const rewardTokenPriceFeedResults = results[`${PRICE_FEED_PREFIX_KEY}-${rewardTokenAddress}`];

  // 1. Reward Token results
  const rewardToken: TokenWithRate = {
    address: rewardTokenAddress,
    decimals: results[REWARD_DECIMALS_KEY],
    name: results[REWARD_NAME_KEY],
    symbol: results[REWARD_SYMBOL_KEY],
    assetRateUsd: rewardTokenPriceFeedResults,
  };

  return {
    gasTokenMarketRateUsd,
    isRngAuctionOpen,
    currentRewardPortionRng,
    rewardToken,
  };
};
