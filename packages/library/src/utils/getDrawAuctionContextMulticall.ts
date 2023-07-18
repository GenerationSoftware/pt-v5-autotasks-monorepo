import { ethers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import { AuctionContracts, DrawAuctionContext, TokenWithRate } from '../types';
import { getGasTokenMarketRateUsd } from '.';
import { ERC20Abi } from '../abis/ERC20Abi';

const { MulticallWrapper } = ethersMulticallProviderPkg;

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

  queries[`reward-decimals`] = rewardTokenContract.decimals();
  queries[`reward-name`] = rewardTokenContract.name();
  queries[`reward-symbol`] = rewardTokenContract.symbol();

  // 2. Native token (gas token) market rate in USD
  const gasTokenMarketRateUsd = await getGasTokenMarketRateUsd(auctionContracts.marketRateContract);

  // 3. Auction info
  const isRNGAuctionOpen = await auctionContracts.rngAuctionContract.isRNGAuctionOpen();

  const currentRewardPortionRng = await auctionContracts.rngAuctionContract.currentRewardPortion();
  // const currentRewardPortionDraw =
  //   await auctionContracts.drawAuctionContract.currentRewardPortion();

  // 4. Price Feed
  queries[`priceFeed-${rewardTokenAddress}`] = auctionContracts.marketRateContract.priceFeed(
    rewardTokenAddress,
    'USD',
  );

  // 7. Get and process results!
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // const marketRateMulticallResults = results[marketRateAddress];
  const rewardTokenPriceFeedResults = results[`priceFeed-${rewardTokenAddress}`];

  // 1. Reward Token results
  const rewardToken: TokenWithRate = {
    address: rewardTokenAddress,
    decimals: results['reward-decimals'],
    name: results['reward-name'],
    symbol: results['reward-symbol'],
    assetRateUsd: rewardTokenPriceFeedResults,
  };

  return {
    gasTokenMarketRateUsd,
    isRNGAuctionOpen,
    currentRewardPortionRng,
    rewardToken,
  };
};
