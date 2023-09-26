import { BigNumber, ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import {
  AuctionContracts,
  DrawAuctionContext,
  DrawAuctionRelayerContext,
  TokenWithRate,
  RngDrawAuctionContext,
  RelayDrawAuctionContext,
} from '../types';
import {
  getGasPrice,
  getEthMainnetTokenMarketRateUsd,
  getNativeTokenMarketRateUsd,
} from './getUsd';
import { ERC20Abi } from '../abis/ERC20Abi';
import { VrfRngAbi } from '../abis/VrfRngAbi';
import { printSpacer } from './logging';

const { MulticallWrapper } = ethersMulticallProviderPkg;

export enum DrawAuctionState {
  RngStart = 'RngStart',
  RngStartVrfHelper = 'RngVrfHelper',
  RngRelayDirect = 'RngRelayDirect',
  RngRelayBridge = 'RngRelayBridge',
}

const PRIZE_POOL_OPEN_DRAW_ENDS_AT_KEY = 'prizePool-openDrawEndsAt';

const RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY = 'rngFeeToken-balanceOfBot';
const RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY =
  'rngAuctionHelper-allowanceBotRngFeeToken';
const RNG_FEE_TOKEN_DECIMALS_KEY = 'rngFeeToken-decimals';
const RNG_FEE_TOKEN_NAME_KEY = 'rngFeeToken-name';
const RNG_FEE_TOKEN_SYMBOL_KEY = 'rngFeeToken-symbol';

const REWARD_DECIMALS_KEY = 'rewardToken-decimals';
const REWARD_NAME_KEY = 'rewardToken-name';
const REWARD_SYMBOL_KEY = 'rewardToken-symbol';

const RNG_LAST_AUCTION_RESULT_KEY = 'rng-lastAuctionResultKey';
const RNG_IS_AUCTION_OPEN_KEY = 'rng-isAuctionOpen';
const RNG_IS_RNG_COMPLETE_KEY = 'rng-isRngComplete';
const RNG_CURRENT_FRACTIONAL_REWARD_KEY = 'rng-currentFractionalReward';

const RNG_RELAY_LAST_SEQUENCE_ID_KEY = 'rngRelay-lastSequenceId';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Combines the two DrawAuction Multicalls, one for the RNG Chain and one for the Relay/PrizePool chain
 *
 * @param rngChainId chain ID that starts the RNG Request
 * @param rngReadProvider a read-capable provider for the RNG chain that should be queried
 * @param relayChainId chain ID that relays and finishes the auction
 * @param relayReadProvider a read-capable provider for the Relay/PrizePool chain that should be queried
 * @param auctionContracts AuctionContracts, a collection of ethers contracts to use for querying
 * @param relayerAddress the bot's address
 * @param rewardRecipient the account which will receive rewards for submitting RNG requests and finishing auctions
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns DrawAuctionContext
 */
export const getDrawAuctionContextMulticall = async (
  rngChainId: number,
  rngReadProvider: Provider,
  relayChainId: number,
  relayReadProvider: Provider,
  auctionContracts: AuctionContracts,
  relayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Gathering info on state of auctions ...`));
  const context: DrawAuctionContext = await getContext(
    rngChainId,
    rngReadProvider,
    relayChainId,
    relayReadProvider,
    auctionContracts,
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
  rngChainId: number,
  rngReadProvider: Provider,
  relayChainId: number,
  relayReadProvider: Provider,
  auctionContracts: AuctionContracts,
  relayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  const prizePoolReserve = await auctionContracts.prizePoolContract.reserve();
  const prizePoolReserveForOpenDraw = await auctionContracts.prizePoolContract.reserveForOpenDraw();
  const reserve = prizePoolReserve.add(prizePoolReserveForOpenDraw);

  printSpacer();
  console.log(chalk.dim(`Running get RNG multicall ...`));

  // 2. Rng Info
  const rngContext = await getRngMulticall(
    rngReadProvider,
    auctionContracts,
    relayerAddress,
    reserve,
    covalentApiKey,
  );

  console.log(chalk.dim(`Running get Relay multicall ...`));

  // 2. Relay info
  const relayContext = await getRelayMulticall(
    relayReadProvider,
    auctionContracts,
    rewardRecipient,
    rngContext,
    covalentApiKey,
  );

  // 3. Native tokens (gas tokens) market rates in USD
  const rngNativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(rngChainId);
  const relayNativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(relayChainId);

  // 4. Fees & Rewards
  const rngExpectedRewardUsd = rngContext.rngExpectedReward * relayContext.rewardToken.assetRateUsd;

  return {
    ...rngContext,
    ...relayContext,
    rngNativeTokenMarketRateUsd,
    relayNativeTokenMarketRateUsd,
    rngExpectedRewardUsd,
  };
};

// Gather information about the PrizePool, RNG Relay contracts and token (ie. reserve, reward)
/**
 * Gather information about the RNG Start Contracts
 *
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param auctionContracts AuctionContracts, a collection of ethers contracts to use for querying
 * @returns DrawAuctionContext
 */
export const getRngMulticall = async (
  rngReadProvider: Provider,
  auctionContracts: AuctionContracts,
  relayerAddress: string,
  reserve: BigNumber,
  covalentApiKey?: string,
): Promise<RngDrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(rngReadProvider);

  let queries: Record<string, any> = {};

  // 2. RNG Auction Service Info
  const rngService = await auctionContracts.rngAuctionContract.getNextRngService();
  const rngServiceContract = new ethers.Contract(rngService, VrfRngAbi, rngReadProvider);
  const rngServiceRequestFee = await rngServiceContract.getRequestFee();

  const rngFeeTokenAddress = rngServiceRequestFee[0];
  // const rngBaseFeeAmount = rngServiceRequestFee[1];

  // 3. RNG Estimated Fee from VrfHelper
  const { gasPrice } = await getGasPrice(rngReadProvider);
  const requestGasPriceWei = gasPrice;
  // const feeData = await getFees(rngReadProvider);
  // const requestGasPriceWei = feeData.avgFeePerGas;

  const chainlinkVRFV2DirectRngAuctionHelperContract =
    await auctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract;
  const vrfHelperRequestFee = await chainlinkVRFV2DirectRngAuctionHelperContract.estimateRequestFee(
    requestGasPriceWei,
  );
  const rngFeeAmount = vrfHelperRequestFee._requestFee;

  const rngFeeTokenIsSet = rngFeeTokenAddress !== ZERO_ADDRESS;
  if (rngFeeTokenIsSet) {
    const rngFeeTokenContract = new ethers.Contract(rngFeeTokenAddress, ERC20Abi, rngReadProvider);
    queries[RNG_FEE_TOKEN_DECIMALS_KEY] = rngFeeTokenContract.decimals();
    queries[RNG_FEE_TOKEN_NAME_KEY] = rngFeeTokenContract.name();
    queries[RNG_FEE_TOKEN_SYMBOL_KEY] = rngFeeTokenContract.symbol();

    queries[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY] = rngFeeTokenContract.balanceOf(relayerAddress);

    queries[RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY] = rngFeeTokenContract.allowance(
      relayerAddress,
      auctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
    );
  }

  // // 5. Auction info
  // 5a. RNG Auction
  queries[RNG_LAST_AUCTION_RESULT_KEY] = auctionContracts.rngAuctionContract.getLastAuctionResult();
  queries[RNG_IS_AUCTION_OPEN_KEY] = auctionContracts.rngAuctionContract.isAuctionOpen();
  queries[RNG_IS_RNG_COMPLETE_KEY] = auctionContracts.rngAuctionContract.isRngComplete();
  queries[RNG_CURRENT_FRACTIONAL_REWARD_KEY] =
    auctionContracts.rngAuctionContract.currentFractionalReward();

  // -------------------------------

  //
  // 6. Get and process results
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 6b. Results: RNG Auction Service Info
  let rngFeeTokenMarketRateUsd;
  let rngFeeToken: TokenWithRate;
  if (rngFeeTokenIsSet) {
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
  }

  // 6d. Results: Auction Info
  const rngIsAuctionOpen = results[RNG_IS_AUCTION_OPEN_KEY];
  const rngIsRngComplete = results[RNG_IS_RNG_COMPLETE_KEY];
  const rngCurrentFractionalReward = results[RNG_CURRENT_FRACTIONAL_REWARD_KEY];

  const rngCurrentFractionalRewardString = ethers.utils.formatEther(rngCurrentFractionalReward);

  // TODO: Assume 18 decimals. In the future may need to format using rewardToken's decimals instead
  const reserveStr = ethers.utils.formatEther(reserve);
  const rngExpectedReward = Number(reserveStr) * Number(rngCurrentFractionalRewardString);

  // 6g. Results: Rng Fee
  let relayer: DrawAuctionRelayerContext;
  if (rngFeeTokenIsSet) {
    relayer = {
      rngFeeTokenBalance: BigNumber.from(results[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY]),
      rngFeeTokenAllowance: BigNumber.from(
        results[RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY],
      ),
    };
  }

  let rngFeeUsd = 0;
  if (rngFeeTokenIsSet) {
    rngFeeUsd =
      parseFloat(formatUnits(rngFeeAmount, rngFeeToken.decimals)) * rngFeeToken.assetRateUsd;
  }

  return {
    rngFeeTokenIsSet,
    rngFeeToken,
    rngFeeAmount,
    rngFeeUsd,
    rngIsAuctionOpen,
    rngIsRngComplete,
    rngExpectedReward,
    relayer,
  };
};

/**
 * Gather information about the RNG Start Contracts
 *
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param auctionContracts AuctionContracts, a collection of ethers contracts to use for querying
 * @returns DrawAuctionContext
 */
export const getRelayMulticall = async (
  readProvider: Provider,
  auctionContracts: AuctionContracts,
  rewardRecipient: string,
  rngContext: RngDrawAuctionContext,
  covalentApiKey?: string,
): Promise<RelayDrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(readProvider);

  let queries: Record<string, any> = {};

  // 1. Prize Pool Info
  queries[PRIZE_POOL_OPEN_DRAW_ENDS_AT_KEY] = auctionContracts.prizePoolContract.openDrawEndsAt();

  // 3. Info about the reward token (prize token)
  const rewardTokenAddress = await auctionContracts.prizePoolContract.prizeToken();
  const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, readProvider);

  queries[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
  queries[REWARD_NAME_KEY] = rewardTokenContract.name();
  queries[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

  // // 5. Auction info
  // 5a. RngRelay Auction
  queries[RNG_RELAY_LAST_SEQUENCE_ID_KEY] = auctionContracts.rngAuctionContract.lastSequenceId();

  //
  // 6. Get and process results
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 6a. Results: Prize Pool
  const prizePoolOpenDrawEndsAt = Number(results[PRIZE_POOL_OPEN_DRAW_ENDS_AT_KEY]);

  // 6b. Results: Reward Token
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

  // 6d. Results: Auction Info
  const rngRelayLastSequenceId = results[RNG_RELAY_LAST_SEQUENCE_ID_KEY];

  const lastSequenceCompleted = await auctionContracts.rngRelayAuctionContract.isSequenceCompleted(
    rngRelayLastSequenceId,
  );

  const rngRelayIsAuctionOpen =
    rngRelayLastSequenceId > 0 && rngContext.rngIsRngComplete && !lastSequenceCompleted;

  // 6f. Results: Draw/Relayer Reward
  let rngRelayExpectedReward, rngRelayExpectedRewardUsd;
  if (rngRelayIsAuctionOpen) {
    const [randomNumber, completedAt] =
      await auctionContracts.rngAuctionContract.callStatic.getRngResults();
    const rngLastAuctionResult = await auctionContracts.rngAuctionContract.getLastAuctionResult();
    const elapsedTime = Math.floor(Date.now() / 1000) - Number(completedAt.toString());

    const rngRelayRewardFraction =
      await auctionContracts.rngRelayAuctionContract.computeRewardFraction(elapsedTime);

    const auctionResult = {
      rewardFraction: rngRelayRewardFraction,
      recipient: rewardRecipient,
    };

    const auctionResults = [];
    auctionResults[0] = rngLastAuctionResult;
    auctionResults[1] = auctionResult;

    const rngRelayExpectedRewardResult =
      await auctionContracts.rngRelayAuctionContract.callStatic.computeRewards(auctionResults);
    rngRelayExpectedReward = rngRelayExpectedRewardResult[1];

    rngRelayExpectedRewardUsd =
      parseFloat(formatUnits(rngRelayExpectedReward.toString(), rewardToken.decimals)) *
      rewardToken.assetRateUsd;
  }

  return {
    prizePoolOpenDrawEndsAt,
    rewardToken,
    rngRelayIsAuctionOpen,
    rngRelayExpectedReward,
    rngRelayExpectedRewardUsd,
    rngRelayLastSequenceId,
  };
};

//    If in RNG Start state figure out if we need to run:
//     RngAuction#startRngRequest (if blockhash),
//     ChainlinkVRFV2DirectRngAuctionHelper#transferFeeAndStartRngRequest (if VRF),
//
//    If in relay state,
//     or RngRelayAuction#relay (if blockhash), or
//     rngAuctionRelayerRemoteOwnerContract#relay (if VRF)
const getDrawAuctionState = (context: DrawAuctionContext): DrawAuctionState => {
  if (context.rngIsAuctionOpen && context.rngFeeTokenIsSet && context.rngFeeUsd > 0) {
    return DrawAuctionState.RngStartVrfHelper;
  } else if (context.rngIsAuctionOpen) {
    return DrawAuctionState.RngStart;
  } else if (context.rngRelayIsAuctionOpen) {
    return DrawAuctionState.RngRelayBridge;
  } else if (context.rngRelayIsAuctionOpen) {
    return DrawAuctionState.RngRelayDirect;
  }
};
