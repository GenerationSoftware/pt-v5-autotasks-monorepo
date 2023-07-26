import { BigNumber, ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import {
  AuctionContracts,
  DrawAuctionContext,
  DrawAuctionRelayerContext,
  TokenWithRate,
} from '../types';
import { getEthMainnetTokenMarketRateUsd, getNativeTokenMarketRateUsd } from './getUsd';
import { ERC20Abi } from '../abis/ERC20Abi';
// import { VrfRngAbi } from '../abis/VrfRngAbi';

const { MulticallWrapper } = ethersMulticallProviderPkg;

const RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY = 'rng-fee-token-balanceOf-bot';
const RNG_AUCTION_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY = 'rng-auction-allowance-bot-rng-fee-token';
const RNG_FEE_TOKEN_DECIMALS_KEY = 'rng-fee-token-decimals';
const RNG_FEE_TOKEN_NAME_KEY = 'rng-fee-token-decimals';
const RNG_FEE_TOKEN_SYMBOL_KEY = 'rng-fee-token-decimals';

const REWARD_DECIMALS_KEY = 'reward-decimals';
const REWARD_NAME_KEY = 'reward-name';
const REWARD_SYMBOL_KEY = 'reward-symbol';

const RNG_IS_AUCTION_OPEN = 'rng-isAuctionOpen';
const RNG_EXPECTED_REWARD_KEY = 'rng-expectedReward';
const DRAW_IS_AUCTION_OPEN = 'draw-isAuctionOpen';
const DRAW_EXPECTED_REWARD_KEY = 'draw-expectedReward';
const PRICE_FEED_PREFIX_KEY = 'priceFeed';

/**
 * Gather information about the draw auction, the prize (ie. reserve, reward) token
 *
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param auctionContracts AuctionContracts, a collection of ethers contracts to use for querying
 * @returns DrawAuctionContext
 */
export const getDrawAuctionContextMulticall = async (
  chainId: number,
  readProvider: Provider,
  auctionContracts: AuctionContracts,
  relayerAddress: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(readProvider);

  let queries: Record<string, any> = {};

  // 1. Prize Pool Info
  const prizePoolReserve = await auctionContracts.prizePoolContract.reserve();

  // 2. RNG Auction Service Info
  const rngService = await auctionContracts.rngAuctionContract.getRngService();
  const rngServiceContract = new ethers.Contract(rngService, VrfRngAbi, readProvider);
  const rngServiceRequestFee = await rngServiceContract.getRequestFee();

  const rngFeeTokenAddress = rngServiceRequestFee[0];
  console.log('rngFeeTokenAddress');
  console.log(rngFeeTokenAddress.toString());
  const rngFeeAmount = rngServiceRequestFee[1];
  console.log('rngFeeAmount');
  console.log(rngFeeAmount);
  console.log(rngFeeAmount.toString());
  const rngFeeTokenContract = new ethers.Contract(rngFeeTokenAddress, ERC20Abi, readProvider);

  queries[RNG_FEE_TOKEN_DECIMALS_KEY] = rngFeeTokenContract.decimals();
  queries[RNG_FEE_TOKEN_NAME_KEY] = rngFeeTokenContract.name();
  queries[RNG_FEE_TOKEN_SYMBOL_KEY] = rngFeeTokenContract.symbol();

  queries[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY] = rngFeeTokenContract.balanceOf(relayerAddress);

  queries[RNG_AUCTION_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY] = rngFeeTokenContract.allowance(
    relayerAddress,
    auctionContracts.rngAuctionContract.address,
  );

  // 3. Info about the reward token (prize token)
  const rewardTokenAddress = await auctionContracts.prizePoolContract.prizeToken();
  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, readProvider);

  queries[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queries[REWARD_NAME_KEY] = rewardTokenContract.name();
  queries[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  queries[`${PRICE_FEED_PREFIX_KEY}-${rewardTokenAddress}`] =
    auctionContracts.marketRateContract.priceFeed(rewardTokenAddress, 'USD');

  // 4. Native token (gas token) market rate in USD
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  // // 5. Auction info
  // 5a. RNG Auction
  queries[RNG_IS_AUCTION_OPEN] = auctionContracts.rngAuctionContract.isAuctionOpen();
  queries[RNG_EXPECTED_REWARD_KEY] =
    auctionContracts.rngAuctionContract.expectedReward(prizePoolReserve);

  // 5b. Draw Auction
  queries[DRAW_IS_AUCTION_OPEN] = auctionContracts.drawAuctionContract.isAuctionOpen();
  queries[DRAW_EXPECTED_REWARD_KEY] =
    auctionContracts.drawAuctionContract.expectedReward(prizePoolReserve);

  // -------------------------------

  //
  // 6. Get and process results
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 6a. Results: Reward Token
  const rewardTokenMarketRateUsd = await getEthMainnetTokenMarketRateUsd(
    results[REWARD_SYMBOL_KEY],
    rewardTokenAddress,
    covalentApiKey,
  );
  // const rewardTokenPriceFeedResults = results[`${PRICE_FEED_PREFIX_KEY}-${rewardTokenAddress}`];
  // assetRateUsd: rewardTokenPriceFeedResults,
  const rewardToken: TokenWithRate = {
    address: rewardTokenAddress,
    decimals: results[REWARD_DECIMALS_KEY],
    name: results[REWARD_NAME_KEY],
    symbol: results[REWARD_SYMBOL_KEY],
    assetRateUsd: rewardTokenMarketRateUsd,
  };

  // 6b. Results: RNG Auction Service Info
  const rngFeeTokenMarketRateUsd = await getEthMainnetTokenMarketRateUsd(
    results[RNG_FEE_TOKEN_SYMBOL_KEY],
    rngFeeTokenAddress,
    covalentApiKey,
  );
  const rngFeeToken: TokenWithRate = {
    address: rngFeeTokenAddress,
    decimals: results[RNG_FEE_TOKEN_DECIMALS_KEY],
    name: results[RNG_FEE_TOKEN_NAME_KEY],
    symbol: results[RNG_FEE_TOKEN_SYMBOL_KEY],
    assetRateUsd: rngFeeTokenMarketRateUsd,
  };
  console.log('rngFeeToken');
  console.log(rngFeeToken);

  // 6b. Results: Auction Info
  const rngIsAuctionOpen = results[RNG_IS_AUCTION_OPEN];
  const rngExpectedReward = results[RNG_EXPECTED_REWARD_KEY];

  const drawIsAuctionOpen = results[DRAW_IS_AUCTION_OPEN];
  const drawExpectedReward = results[DRAW_EXPECTED_REWARD_KEY];

  // 6c. Results: Rng Reward
  console.log('rngExpectedReward');
  console.log(rngExpectedReward);
  console.log(rngExpectedReward.toString());

  const rngExpectedRewardUsd =
    parseFloat(formatUnits(rngExpectedReward, rewardToken.decimals)) * rewardToken.assetRateUsd;
  console.log('rngExpectedRewardUsd');
  console.log(rngExpectedRewardUsd);

  // 6d. Results: Draw Reward
  console.log('drawExpectedReward');
  console.log(drawExpectedReward);
  console.log(drawExpectedReward.toString());

  const drawExpectedRewardUsd =
    parseFloat(formatUnits(drawExpectedReward, rewardToken.decimals)) * rewardToken.assetRateUsd;

  console.log('drawExpectedRewardUsd');
  console.log(drawExpectedRewardUsd);

  const relayer: DrawAuctionRelayerContext = {
    rngFeeTokenBalance: BigNumber.from(results[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY]),
    rngFeeTokenAllowance: BigNumber.from(results[RNG_AUCTION_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY]),
  };
  // const rngFeeTokenBalance = results[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY];
  console.log('rngFeeTokenBalance');
  console.log(relayer.rngFeeTokenBalance);
  console.log(relayer.rngFeeTokenBalance.toString());

  console.log('rngFeeTokenAllowance');
  console.log(relayer.rngFeeTokenAllowance);
  console.log(relayer.rngFeeTokenAllowance.toString());

  return {
    prizePoolReserve,
    nativeTokenMarketRateUsd,
    rewardToken,
    rngFeeToken,
    rngFeeAmount,
    rngIsAuctionOpen,
    rngExpectedReward,
    rngExpectedRewardUsd,
    drawIsAuctionOpen,
    drawExpectedReward,
    drawExpectedRewardUsd,
    relayer,
  };
};
