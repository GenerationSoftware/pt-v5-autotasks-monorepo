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
import { VrfRngAbi } from '../abis/VrfRngAbi';

const { MulticallWrapper } = ethersMulticallProviderPkg;

const RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY = 'rng-fee-token-balanceOf-bot';
const RNG_AUCTION_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY = 'rng-auction-allowance-bot-rng-fee-token';
const RNG_FEE_TOKEN_DECIMALS_KEY = 'rng-fee-token-decimals';
const RNG_FEE_TOKEN_NAME_KEY = 'rng-fee-token-decimals';
const RNG_FEE_TOKEN_SYMBOL_KEY = 'rng-fee-token-decimals';

const REWARD_DECIMALS_KEY = 'reward-decimals';
const REWARD_NAME_KEY = 'reward-name';
const REWARD_SYMBOL_KEY = 'reward-symbol';

const RNG_LAST_AUCTION_RESULT_KEY = 'rng-lastAuctionResultKey';
const RNG_IS_AUCTION_OPEN_KEY = 'rng-isAuctionOpen';
const RNG_IS_RNG_COMPLETE_KEY = 'rng-isRngComplete';
const RNG_CURRENT_FRACTIONAL_REWARD_KEY = 'rng-currentFractionalReward';

const RNG_RELAY_LAST_SEQUENCE_ID_KEY = 'rngRelay-lastSequenceId';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(readProvider);

  let queries: Record<string, any> = {};

  // 1. Prize Pool Info
  // const prizePoolReserve = await auctionContracts.prizePoolContract.reserve();

  // 2. RNG Auction Service Info
  const rngService = await auctionContracts.rngAuctionContract.getNextRngService();
  const rngServiceContract = new ethers.Contract(rngService, VrfRngAbi, readProvider);
  const rngServiceRequestFee = await rngServiceContract.getRequestFee();

  const rngFeeTokenAddress = rngServiceRequestFee[0];
  const rngFeeAmount = rngServiceRequestFee[1];

  const rngFeeTokenIsSet = rngFeeTokenAddress !== ZERO_ADDRESS;
  if (rngFeeTokenIsSet) {
    const rngFeeTokenContract = new ethers.Contract(rngFeeTokenAddress, ERC20Abi, readProvider);
    queries[RNG_FEE_TOKEN_DECIMALS_KEY] = rngFeeTokenContract.decimals();
    queries[RNG_FEE_TOKEN_NAME_KEY] = rngFeeTokenContract.name();
    queries[RNG_FEE_TOKEN_SYMBOL_KEY] = rngFeeTokenContract.symbol();

    queries[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY] = rngFeeTokenContract.balanceOf(relayerAddress);

    queries[RNG_AUCTION_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY] = rngFeeTokenContract.allowance(
      relayerAddress,
      auctionContracts.rngAuctionContract.address,
    );
  }

  // 3. Info about the reward token (prize token)
  const rewardTokenAddress = await auctionContracts.prizePoolContract.prizeToken();
  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, readProvider);

  queries[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queries[REWARD_NAME_KEY] = rewardTokenContract.name();
  queries[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  // 4. Native token (gas token) market rate in USD
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  // // 5. Auction info
  // 5a. RNG Auction
  queries[RNG_LAST_AUCTION_RESULT_KEY] = auctionContracts.rngAuctionContract.getLastAuctionResult();
  queries[RNG_IS_AUCTION_OPEN_KEY] = auctionContracts.rngAuctionContract.isAuctionOpen();
  queries[RNG_IS_RNG_COMPLETE_KEY] = auctionContracts.rngAuctionContract.isRngComplete();
  queries[RNG_CURRENT_FRACTIONAL_REWARD_KEY] =
    auctionContracts.rngAuctionContract.currentFractionalReward();

  // 5b. RngRelay Auction
  queries[RNG_RELAY_LAST_SEQUENCE_ID_KEY] =
    auctionContracts.rngRelayAuctionContract.lastSequenceId();

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

  const rewardToken: TokenWithRate = {
    address: rewardTokenAddress,
    decimals: results[REWARD_DECIMALS_KEY],
    name: results[REWARD_NAME_KEY],
    symbol: results[REWARD_SYMBOL_KEY],
    assetRateUsd: rewardTokenMarketRateUsd,
  };

  // 6b. Results: RNG Auction Service Info
  let rngFeeTokenMarketRateUsd;
  let rngFeeToken: TokenWithRate;
  if (rngFeeTokenIsSet) {
    console.log('rngFeeTokenAddress');
    console.log(rngFeeTokenAddress);
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
    console.log('rngFeeToken');
    console.log(rngFeeToken);
  }

  // 6b. Results: Auction Info
  const rngIsAuctionOpen = results[RNG_IS_AUCTION_OPEN_KEY];
  const rngRelayLastSequenceId = results[RNG_RELAY_LAST_SEQUENCE_ID_KEY];
  console.log('rngRelayLastSequenceId');
  console.log(rngRelayLastSequenceId);
  const rngIsRngComplete = results[RNG_IS_RNG_COMPLETE_KEY];
  const rngExpectedReward = results[RNG_CURRENT_FRACTIONAL_REWARD_KEY];

  const lastSequenceCompleted = await auctionContracts.rngRelayAuctionContract.isSequenceCompleted(
    rngRelayLastSequenceId,
  );
  const rngRelayIsAuctionOpen =
    rngRelayLastSequenceId > 0 && rngIsRngComplete && !lastSequenceCompleted;

  // 6c. Results: Rng Reward
  const rngExpectedRewardUsd =
    parseFloat(formatUnits(rngExpectedReward, rewardToken.decimals)) * rewardToken.assetRateUsd;

  // 6d. Results: Draw Reward
  let rngRelayExpectedReward, rngRelayExpectedRewardUsd;
  if (rngRelayIsAuctionOpen) {
    console.log('compute rng relay reward fraction...');
    const [randomNumber, completedAt] =
      await auctionContracts.rngAuctionContract.callStatic.getRngResults();
    console.log('completedAt');
    console.log(completedAt);
    const rngLastAuctionResult = await auctionContracts.rngAuctionContract.getLastAuctionResult();
    const elapsedTime = Date.now() - completedAt;
    const rngRelayRewardFraction =
      await auctionContracts.rngRelayAuctionContract.computeRewardFraction(elapsedTime);

    console.log('rngRelayRewardFraction');
    console.log(rngRelayRewardFraction);

    const auctionResult = {
      rewardFraction: rngRelayRewardFraction,
      recipient: rewardRecipient,
    };

    const auctionResults = [];
    auctionResults[0] = rngLastAuctionResult;
    auctionResults[1] = auctionResult;

    const rngRelayExpectedReward = await auctionContracts.rngRelayAuctionContract.computeRewards(
      auctionResults,
    );

    console.log('rngRelayExpectedReward');
    console.log(rngRelayExpectedReward);
    console.log(rngRelayExpectedReward.toString());

    rngRelayExpectedRewardUsd =
      parseFloat(formatUnits(rngRelayExpectedReward, rewardToken.decimals)) *
      rewardToken.assetRateUsd;

    console.log('rngRelayExpectedRewardUsd');
    console.log(rngRelayExpectedRewardUsd);
  }

  // 6e. Results: Rng Fee
  let relayer: DrawAuctionRelayerContext;
  if (rngFeeTokenIsSet) {
    relayer = {
      rngFeeTokenBalance: BigNumber.from(results[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY]),
      rngFeeTokenAllowance: BigNumber.from(results[RNG_AUCTION_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY]),
    };

    console.log('relayer');
    console.log(relayer);

    // const rngFeeTokenBalance = results[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY];
    console.log('rngFeeTokenBalance');
    console.log(relayer.rngFeeTokenBalance);
    console.log(relayer.rngFeeTokenBalance.toString());

    console.log('rngFeeTokenAllowance');
    console.log(relayer.rngFeeTokenAllowance);
    console.log(relayer.rngFeeTokenAllowance.toString());
  }

  let rngFeeUsd = 0;
  if (rngIsAuctionOpen && rngFeeTokenIsSet) {
    rngFeeUsd =
      parseFloat(formatUnits(rngFeeAmount, rngFeeToken.decimals)) * rngFeeToken.assetRateUsd;
    console.log('rngFeeUsd');
    console.log(rngFeeUsd);
  }

  return {
    // prizePoolReserve,
    nativeTokenMarketRateUsd,
    rewardToken,
    rngFeeTokenIsSet,
    rngFeeToken,
    rngFeeAmount,
    rngFeeUsd,
    rngIsAuctionOpen,
    rngIsRngComplete,
    rngExpectedReward,
    rngExpectedRewardUsd,
    rngRelayIsAuctionOpen,
    rngRelayExpectedReward,
    rngRelayExpectedRewardUsd,
    relayer,
  };
};
