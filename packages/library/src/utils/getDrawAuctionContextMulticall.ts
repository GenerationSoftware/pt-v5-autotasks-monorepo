import { BigNumber, ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';
import ethersMulticallProviderPkg from 'ethers-multicall-provider';

import {
  RngAuctionContracts,
  DrawAuctionContext,
  DrawAuctionRelayerContext,
  TokenWithRate,
  RngDrawAuctionContext,
  RelayDrawAuctionContext,
  Relay,
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

const { MulticallWrapper } = ethersMulticallProviderPkg;

export enum DrawAuctionState {
  RngStart = 'RngStart',
  RngStartVrfHelper = 'RngVrfHelper',
  RngRelayDirect = 'RngRelayDirect',
  RngRelayBridge = 'RngRelayBridge',
}

const PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY = 'prizePool-prizeTokenAddress';
const PRIZE_POOL_DRAW_CLOSES_AT_KEY = 'prizePool-drawClosesAt';
const PRIZE_POOL_OPEN_DRAW_ID_KEY = 'prizePool-openDrawId';
const PRIZE_POOL_RESERVE_KEY = 'prizePool-reserve';
const PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY = 'prizePool-pendingReserveContributions';

const RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY =
  'rngAuctionHelper-allowanceBotRngFeeToken';
const RNG_AUCTION_HELPER_ESTIMATE_REQUEST_FEE = 'rngAuctionHelper-estimateRequestFee';

const RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY = 'rngFeeToken-balanceOfBot';
const RNG_FEE_TOKEN_DECIMALS_KEY = 'rngFeeToken-decimals';
const RNG_FEE_TOKEN_NAME_KEY = 'rngFeeToken-name';
const RNG_FEE_TOKEN_SYMBOL_KEY = 'rngFeeToken-symbol';

const REWARD_DECIMALS_KEY = 'rewardToken-decimals';
const REWARD_NAME_KEY = 'rewardToken-name';
const REWARD_SYMBOL_KEY = 'rewardToken-symbol';

const RNG_AUCTION_LAST_AUCTION_RESULT_KEY = 'rng-lastAuctionResultKey';
const RNG_AUCTION_IS_AUCTION_OPEN_KEY = 'rng-isAuctionOpen';
const RNG_AUCTION_IS_RNG_COMPLETE_KEY = 'rng-isRngComplete';
const RNG_AUCTION_CURRENT_FRACTIONAL_REWARD_KEY = 'rng-currentFractionalReward';
const RNG_AUCTION_LAST_SEQUENCE_ID_KEY = 'rngAuction-lastSequenceId';
const RNG_AUCTION_GET_RNG_RESULTS_KEY = 'rngAuction-getRngResults';
const RNG_AUCTION_AUCTION_DURATION_KEY = 'rngAuction-auctionDuration';

const RNG_RELAY_IS_SEQUENCE_COMPLETED_KEY = 'rngRelayAuction-isSequenceCompleted';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Combines the two DrawAuction Multicalls, one for the RNG Chain and one for the Relay/PrizePool chain
 *
 * @param rngChainId chain ID that starts the RNG Request
 * @param l1Provider provider for the RNG chain that will be queried
 * @param relays Relay[] array of relays for different chains with providers, contracts, etc.
 * @param rngAuctionContracts RngAuctionContracts, a collection of ethers contracts to use for querying
 * @param rngRelayerAddress the bot's address
 * @param rewardRecipient the account which will receive rewards for submitting RNG requests and finishing auctions
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns DrawAuctionContext
 */
export const getDrawAuctionContextMulticall = async (
  rngChainId: number,
  l1Provider: Provider,
  relays: Relay[],
  rngAuctionContracts: RngAuctionContracts,
  rngRelayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Gathering info on state of auctions ...`));
  const context: DrawAuctionContext = await getContext(
    rngChainId,
    l1Provider,
    relays,
    rngAuctionContracts,
    rngRelayerAddress,
    rewardRecipient,
    covalentApiKey,
  );

  // 5. State enum
  const drawAuctionState: DrawAuctionState = getDrawAuctionState(context, relays);

  return {
    ...context,
    drawAuctionState,
  };
};

const getContext = async (
  rngChainId: number,
  l1Provider: Provider,
  relays: Relay[],
  rngAuctionContracts: RngAuctionContracts,
  rngRelayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Running get RNG multicall ...`));

  // 2. Rng Info
  const rngContext = await getRngMulticall(
    l1Provider,
    rngAuctionContracts,
    rngRelayerAddress,
    covalentApiKey,
  );

  console.log(chalk.dim(`Running get Relay multicall ...`));

  // 2. Add context to Relays
  relays = await getRelayMulticall(
    relays,
    rngAuctionContracts,
    rewardRecipient,
    rngContext,
    covalentApiKey,
  );

  console.log(chalk.dim(`Getting RNG token and native (gas) token market rates ...`));

  // 3. Native tokens (gas tokens) market rates in USD
  const rngNativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(rngChainId);

  for (const relay of relays) {
    relay.context.nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(relay.l2ChainId);
  }

  // 4. Fees & Rewards
  let rngExpectedRewardTotalUsd = 0;
  for (const relay of relays) {
    const relayChainExpectedRewardUsd =
      relay.context.rngExpectedReward * relay.context.rewardToken.assetRateUsd;
    rngExpectedRewardTotalUsd += relayChainExpectedRewardUsd;
  }

  return {
    ...rngContext,
    relays,
    rngNativeTokenMarketRateUsd,
    rngExpectedRewardTotalUsd,
  };
};

/**
 * Gather information about the RNG Start Contracts
 *
 * @param l1Provider provider for the chain that will be queried
 * @param rngAuctionContracts rngAuctionContracts, a collection of ethers contracts to use for querying
 * @returns DrawAuctionContext
 */
export const getRngMulticall = async (
  l1Provider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  rngRelayerAddress: string,
  covalentApiKey?: string,
): Promise<RngDrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(l1Provider);

  let queries: Record<string, any> = {};

  // 1. RNG Auction Service / Fee Token Info
  const rngService = await rngAuctionContracts.rngAuctionContract.getNextRngService();
  const rngServiceContract = new ethers.Contract(rngService, VrfRngAbi, l1Provider);
  const rngServiceRequestFee = await rngServiceContract.getRequestFee();
  const rngFeeTokenAddress = rngServiceRequestFee[0];

  // 2. RNG Estimated Fee from VrfHelper
  const { gasPrice } = await getGasPrice(l1Provider);
  const requestGasPriceWei = gasPrice;

  const chainlinkVRFV2DirectRngAuctionHelperContract =
    rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract;
  queries[
    RNG_AUCTION_HELPER_ESTIMATE_REQUEST_FEE
  ] = chainlinkVRFV2DirectRngAuctionHelperContract.callStatic.estimateRequestFee(
    requestGasPriceWei,
  );

  const rngFeeTokenIsSet = rngFeeTokenAddress !== ZERO_ADDRESS;
  if (rngFeeTokenIsSet) {
    const rngFeeTokenContract = new ethers.Contract(rngFeeTokenAddress, ERC20Abi, l1Provider);
    queries[RNG_FEE_TOKEN_DECIMALS_KEY] = rngFeeTokenContract.decimals();
    queries[RNG_FEE_TOKEN_NAME_KEY] = rngFeeTokenContract.name();
    queries[RNG_FEE_TOKEN_SYMBOL_KEY] = rngFeeTokenContract.symbol();

    queries[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY] = rngFeeTokenContract.balanceOf(rngRelayerAddress);

    queries[RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY] = rngFeeTokenContract.allowance(
      rngRelayerAddress,
      rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
    );
  }

  // 3. RNG Auction
  queries[RNG_AUCTION_IS_AUCTION_OPEN_KEY] = rngAuctionContracts.rngAuctionContract.isAuctionOpen();
  queries[RNG_AUCTION_IS_RNG_COMPLETE_KEY] = rngAuctionContracts.rngAuctionContract.isRngComplete();
  queries[
    RNG_AUCTION_CURRENT_FRACTIONAL_REWARD_KEY
  ] = rngAuctionContracts.rngAuctionContract.currentFractionalReward();

  // -------------------------------

  //
  // 4. Get and process results
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 5. Results: RNG Auction Service Info
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

  // 6. Results: Auction Info
  const rngIsAuctionOpen = results[RNG_AUCTION_IS_AUCTION_OPEN_KEY];
  const rngIsRngComplete = results[RNG_AUCTION_IS_RNG_COMPLETE_KEY];
  const rngCurrentFractionalReward = results[RNG_AUCTION_CURRENT_FRACTIONAL_REWARD_KEY];
  const rngCurrentFractionalRewardString = ethers.utils.formatEther(rngCurrentFractionalReward);

  // 7. Results: Rng Fee
  const vrfHelperRequestFee = results[RNG_AUCTION_HELPER_ESTIMATE_REQUEST_FEE];
  const rngFeeAmount = vrfHelperRequestFee._requestFee;

  let rngRelayer: DrawAuctionRelayerContext;
  let rngFeeUsd = 0;
  if (rngFeeTokenIsSet) {
    rngRelayer = {
      rngFeeTokenBalance: BigNumber.from(results[RNG_FEE_TOKEN_BALANCE_OF_BOT_KEY]),
      rngFeeTokenAllowance: BigNumber.from(
        results[RNG_AUCTION_HELPER_ALLOWANCE_BOT_RNG_FEE_TOKEN_KEY],
      ),
    };

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
    rngCurrentFractionalRewardString,
    rngRelayer,
  };
};

/**
 * Gather information about the state of the various relay chains
 *
 * @param relays Relay[] array of relays for different chains with providers, contracts, etc.
 * @param rngAuctionContracts RngAuctionContracts, a collection of ethers contracts to use for querying
 * @param rewardRecipient the account which will receive rewards for submitting RNG requests and finishing auctions
 * @param rngContext what we know so far about the state of the RNG chain auction
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns DrawAuctionContext
 */
export const getRelayMulticall = async (
  relays: Relay[],
  rngAuctionContracts: RngAuctionContracts,
  rewardRecipient: string,
  rngContext: RngDrawAuctionContext,
  covalentApiKey?: string,
): Promise<Relay[]> => {
  printSpacer();

  for (const relay of relays) {
    console.log(chalk.dim(`Getting state context for chain: ${chainName(relay.l2ChainId)}`));

    // @ts-ignore Provider == BaseProvider
    const multicallProvider = MulticallWrapper.wrap(relay.l2Provider);

    let queriesOne: Record<string, any> = {};

    // 1. Prize Pool Info
    queriesOne[PRIZE_POOL_OPEN_DRAW_ID_KEY] = relay.contracts.prizePoolContract.getOpenDrawId();
    queriesOne[PRIZE_POOL_RESERVE_KEY] = relay.contracts.prizePoolContract.reserve();
    queriesOne[
      PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY
    ] = relay.contracts.prizePoolContract.pendingReserveContributions();
    queriesOne[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY] = relay.contracts.prizePoolContract.prizeToken();

    // 2. Auction info
    queriesOne[
      RNG_AUCTION_LAST_SEQUENCE_ID_KEY
    ] = rngAuctionContracts.rngAuctionContract.lastSequenceId();
    queriesOne[
      RNG_AUCTION_GET_RNG_RESULTS_KEY
    ] = rngAuctionContracts.rngAuctionContract.callStatic.getRngResults();
    queriesOne[
      RNG_AUCTION_AUCTION_DURATION_KEY
    ] = rngAuctionContracts.rngAuctionContract.auctionDuration();
    queriesOne[
      RNG_AUCTION_LAST_AUCTION_RESULT_KEY
    ] = rngAuctionContracts.rngAuctionContract.getLastAuctionResult();

    // 4. Get and process first set of results
    const resultsOne = await getEthersMulticallProviderResults(multicallProvider, queriesOne);

    // 5. Start second set of multicalls
    let queriesTwo: Record<string, any> = {};

    // 6. Results One: Prize Pool
    const drawId = resultsOne[PRIZE_POOL_OPEN_DRAW_ID_KEY];
    queriesTwo[PRIZE_POOL_DRAW_CLOSES_AT_KEY] = relay.contracts.prizePoolContract.drawClosesAt(
      drawId,
    );

    // 6. Results One: Auction info
    const [randomNumber, rngCompletedAt] = resultsOne[RNG_AUCTION_GET_RNG_RESULTS_KEY];
    const rngResults: RngResults = { randomNumber, rngCompletedAt };

    let rngLastAuctionResult: AuctionResult = resultsOne[RNG_AUCTION_LAST_AUCTION_RESULT_KEY];

    const auctionDuration = resultsOne[RNG_AUCTION_AUCTION_DURATION_KEY];

    let elapsedTime = Math.floor(Date.now() / 1000) - Number(rngResults.rngCompletedAt.toString());
    let auctionExpired = false;
    if (elapsedTime > auctionDuration) {
      auctionExpired = true;
      elapsedTime = auctionDuration;
    }

    // 7. Results One: Reward Token
    const rewardTokenAddress = resultsOne[PRIZE_POOL_PRIZE_TOKEN_ADDRESS_KEY];
    const rewardTokenContract = new ethers.Contract(rewardTokenAddress, ERC20Abi, relay.l2Provider);

    queriesTwo[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
    queriesTwo[REWARD_NAME_KEY] = rewardTokenContract.name();
    queriesTwo[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

    // 7. Results: Rng Reward
    const rngRelayLastSequenceId = resultsOne[RNG_AUCTION_LAST_SEQUENCE_ID_KEY];

    const prizePoolReserve = resultsOne[PRIZE_POOL_RESERVE_KEY];
    const prizePoolReserveForOpenDraw = resultsOne[PRIZE_POOL_PENDING_RESERVE_CONTRIBUTIONS_KEY];
    const reserve = prizePoolReserve.add(prizePoolReserveForOpenDraw);

    queriesTwo[
      RNG_RELAY_IS_SEQUENCE_COMPLETED_KEY
    ] = relay.contracts.rngRelayAuctionContract.isSequenceCompleted(rngRelayLastSequenceId);

    // 8. Get second set of multicall results
    const resultsTwo = await getEthersMulticallProviderResults(multicallProvider, queriesTwo);

    // 9. Results two: Auction Info
    const lastSequenceCompleted = resultsTwo[RNG_RELAY_IS_SEQUENCE_COMPLETED_KEY];

    const rngRelayIsAuctionOpen =
      rngRelayLastSequenceId > 0 &&
      rngContext.rngIsRngComplete &&
      !lastSequenceCompleted &&
      !auctionExpired;

    // 10. Results two: Reward token
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

    // 11. Results two: Auction info
    const reserveStr = ethers.utils.formatUnits(reserve, rewardToken.decimals);
    const rngExpectedReward =
      Number(reserveStr) * Number(rngContext.rngCurrentFractionalRewardString);
    const rngExpectedRewardUsd = rngExpectedReward * rewardToken.assetRateUsd;

    const prizePoolDrawClosesAt = Number(resultsTwo[PRIZE_POOL_DRAW_CLOSES_AT_KEY]);

    // 12. Results: Draw/Relayer Reward
    let rngRelayExpectedReward, rngRelayExpectedRewardUsd;
    if (rngRelayIsAuctionOpen) {
      const rngRelayRewardFraction = await relay.contracts.rngRelayAuctionContract.computeRewardFraction(
        elapsedTime,
      );

      // Make a new AuctionResult based off the data we currently know (we assume
      // we will be the recipient, and we have the estimated RelayRewardFraction)
      const auctionResult = {
        rewardFraction: rngRelayRewardFraction,
        recipient: rewardRecipient,
      };

      const auctionResults = [];
      auctionResults[0] = rngLastAuctionResult;
      auctionResults[1] = auctionResult;

      const rngRelayExpectedRewardResult = await relay.contracts.rngRelayAuctionContract.callStatic.computeRewards(
        auctionResults,
      );
      rngRelayExpectedReward = rngRelayExpectedRewardResult[1];

      rngRelayExpectedRewardUsd =
        parseFloat(formatUnits(rngRelayExpectedReward.toString(), rewardToken.decimals)) *
        rewardToken.assetRateUsd;
    }

    const context: RelayDrawAuctionContext = {
      prizePoolDrawClosesAt,
      rngResults,
      rngLastAuctionResult,
      rngExpectedReward,
      rngExpectedRewardUsd,
      rewardToken,
      rngRelayIsAuctionOpen,
      rngRelayExpectedReward,
      rngRelayExpectedRewardUsd,
      rngRelayLastSequenceId,
    };
    relay.context = context;
  }

  return relays;
};

//    If in RNG Start state figure out if we need to run:
//     RngAuction#startRngRequest (if blockhash),
//     ChainlinkVRFV2DirectRngAuctionHelper#transferFeeAndStartRngRequest (if VRF),
//
//    If in relay state,
//     or RngRelayAuction#relay (if blockhash), or
//     rngAuctionRelayerRemoteOwnerContract#relay (if VRF)
const getDrawAuctionState = (context: DrawAuctionContext, relays: Relay[]): DrawAuctionState => {
  const anyRelaysOpen = relays
    .map((relay) => relay.context.rngRelayIsAuctionOpen)
    .some((auctionOpen) => !!auctionOpen);

  if (context.rngIsAuctionOpen && context.rngFeeTokenIsSet && context.rngFeeUsd > 0) {
    return DrawAuctionState.RngStartVrfHelper;
  } else if (context.rngIsAuctionOpen) {
    return DrawAuctionState.RngStart;
  } else if (anyRelaysOpen) {
    return DrawAuctionState.RngRelayBridge;
  } else if (anyRelaysOpen) {
    // TODO: Obviously this state doesn't ever get chosen, this will need to be re-worked
    //       if we ever have a PrizePool on the same chain as the RNG
    return DrawAuctionState.RngRelayDirect;
  }
};
