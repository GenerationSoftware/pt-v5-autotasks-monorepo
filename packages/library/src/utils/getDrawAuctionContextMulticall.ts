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
 * @param relays Relay[] array of relays for different chains with readProviders, writeProviders, etc.
 * @param rngAuctionContracts RngAuctionContracts, a collection of ethers contracts to use for querying
 * @param relayerAddress the bot's address
 * @param rewardRecipient the account which will receive rewards for submitting RNG requests and finishing auctions
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns DrawAuctionContext
 */
export const getDrawAuctionContextMulticall = async (
  rngChainId: number,
  rngReadProvider: Provider,
  relays: Relay[],
  rngAuctionContracts: RngAuctionContracts,
  relayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Gathering info on state of auctions ...`));
  const context: DrawAuctionContext = await getContext(
    rngChainId,
    rngReadProvider,
    relays,
    rngAuctionContracts,
    relayerAddress,
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
  rngReadProvider: Provider,
  relays: Relay[],
  rngAuctionContracts: RngAuctionContracts,
  relayerAddress: string,
  rewardRecipient: string,
  covalentApiKey?: string,
): Promise<DrawAuctionContext> => {
  printSpacer();
  console.log(chalk.dim(`Running get RNG multicall ...`));

  // 2. Rng Info
  const rngContext = await getRngMulticall(
    rngReadProvider,
    rngAuctionContracts,
    relayerAddress,
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

  // 3. Native tokens (gas tokens) market rates in USD
  const rngNativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(rngChainId);

  for (const relay of relays) {
    relay.context.nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(relay.chainId);
  }

  // 4. Fees & Rewards
  let rngExpectedRewardTotalUsd = 0;
  for (const relay of relays) {
    const relayChainExpectedRewardUsd =
      relay.context.rngExpectedReward * relay.context.rewardToken.assetRateUsd;
    console.log('relayChainExpectedRewardUsd');
    console.log(relayChainExpectedRewardUsd);
    rngExpectedRewardTotalUsd += relayChainExpectedRewardUsd;
    console.log('rngExpectedRewardTotalUsd');
    console.log(rngExpectedRewardTotalUsd);
  }

  return {
    ...rngContext,
    relays,
    rngNativeTokenMarketRateUsd,
    rngExpectedRewardTotalUsd,
  };
};

// Gather information about the PrizePool, RNG Relay contracts and token (ie. reserve, reward)
/**
 * Gather information about the RNG Start Contracts
 *
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param rngAuctionContracts rngAuctionContracts, a collection of ethers contracts to use for querying
 * @returns DrawAuctionContext
 */
export const getRngMulticall = async (
  rngReadProvider: Provider,
  rngAuctionContracts: RngAuctionContracts,
  relayerAddress: string,
  // reserve: BigNumber,
  covalentApiKey?: string,
): Promise<RngDrawAuctionContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(rngReadProvider);

  let queries: Record<string, any> = {};

  // 2. RNG Auction Service Info
  const rngService = await rngAuctionContracts.rngAuctionContract.getNextRngService();
  const rngServiceContract = new ethers.Contract(rngService, VrfRngAbi, rngReadProvider);
  const rngServiceRequestFee = await rngServiceContract.getRequestFee();

  const rngFeeTokenAddress = rngServiceRequestFee[0];
  // const rngBaseFeeAmount = rngServiceRequestFee[1];

  // 3. RNG Estimated Fee from VrfHelper
  const { gasPrice } = await getGasPrice(rngReadProvider);
  const requestGasPriceWei = gasPrice;
  // const feeData = await getFees(rngReadProvider);
  // const requestGasPriceWei = feeData.avgFeePerGas;

  const chainlinkVRFV2DirectRngAuctionHelperContract = await rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract;
  const vrfHelperRequestFee = await chainlinkVRFV2DirectRngAuctionHelperContract.callStatic.estimateRequestFee(
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
      rngAuctionContracts.chainlinkVRFV2DirectRngAuctionHelperContract.address,
    );
  }

  // // 5. Auction info
  // 5a. RNG Auction
  queries[
    RNG_LAST_AUCTION_RESULT_KEY
  ] = rngAuctionContracts.rngAuctionContract.getLastAuctionResult();
  queries[RNG_IS_AUCTION_OPEN_KEY] = rngAuctionContracts.rngAuctionContract.isAuctionOpen();
  queries[RNG_IS_RNG_COMPLETE_KEY] = rngAuctionContracts.rngAuctionContract.isRngComplete();
  queries[
    RNG_CURRENT_FRACTIONAL_REWARD_KEY
  ] = rngAuctionContracts.rngAuctionContract.currentFractionalReward();

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
    rngCurrentFractionalRewardString,
    relayer,
  };
};

/**
 * Gather information about the state of the various relay chains
 *
 * @param relays Relay[] array of relays for different chains with readProviders, writeProviders, etc.
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
    console.log(chalk.dim('Getting state context for chain:', relay.chainId));

    // @ts-ignore Provider == BaseProvider
    const multicallProvider = MulticallWrapper.wrap(relay.readProvider);

    let queries: Record<string, any> = {};

    // 1. Prize Pool Info
    const drawId = await relay.contracts.prizePoolContract.getOpenDrawId();
    queries[PRIZE_POOL_OPEN_DRAW_ENDS_AT_KEY] = relay.contracts.prizePoolContract.drawClosesAt(
      drawId,
    );

    // 3. Info about the reward token (prize token)
    const rewardTokenAddress = await relay.contracts.prizePoolContract.prizeToken();
    const rewardTokenContract = new ethers.Contract(
      rewardTokenAddress,
      ERC20Abi,
      relay.readProvider,
    );

    queries[REWARD_DECIMALS_KEY] = rewardTokenContract.decimals();
    queries[REWARD_NAME_KEY] = rewardTokenContract.name();
    queries[REWARD_SYMBOL_KEY] = rewardTokenContract.symbol();

    // // 5. Auction info
    // 5a. RngRelay Auction
    queries[
      RNG_RELAY_LAST_SEQUENCE_ID_KEY
    ] = rngAuctionContracts.rngAuctionContract.lastSequenceId();

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

    // 6c. Results: Rng Reward
    const prizePoolReserve = await relay.contracts.prizePoolContract.reserve();
    const prizePoolReserveForOpenDraw = await relay.contracts.prizePoolContract.pendingReserveContributions();
    const reserve = prizePoolReserve.add(prizePoolReserveForOpenDraw);
    // let reserve = BigNumber.from(0);
    // for (const relay of relays) {
    //   const prizePoolReserve = await relay.contracts.prizePoolContract.reserve();
    //   const prizePoolReserveForOpenDraw = await relay.contracts.prizePoolContract.pendingReserveContributions();
    //   console.log('prizePoolReserve.toString()');
    //   console.log(prizePoolReserve.toString());
    //   console.log('prizePoolReserveForOpenDraw.toString()');
    //   console.log(prizePoolReserveForOpenDraw.toString());
    //   reserve = reserve.add(prizePoolReserve.add(prizePoolReserveForOpenDraw));
    //   console.log('reserve.toString()');
    //   console.log(reserve.toString());
    // }
    // TODO: Assume 18 decimals. In the future may need to format using rewardToken's decimals instead
    const reserveStr = ethers.utils.formatEther(reserve);
    const rngExpectedReward =
      Number(reserveStr) * Number(rngContext.rngCurrentFractionalRewardString);
    const rngExpectedRewardUsd = rngExpectedReward * rewardToken.assetRateUsd;

    // 6d. Results: Auction Info
    const rngRelayLastSequenceId = results[RNG_RELAY_LAST_SEQUENCE_ID_KEY];

    const lastSequenceCompleted = await relay.contracts.rngRelayAuctionContract.isSequenceCompleted(
      rngRelayLastSequenceId,
    );

    const rngRelayIsAuctionOpen =
      rngRelayLastSequenceId > 0 && rngContext.rngIsRngComplete && !lastSequenceCompleted;

    // 6e. Results: Draw/Relayer Reward
    let rngRelayExpectedReward, rngRelayExpectedRewardUsd;
    if (rngRelayIsAuctionOpen) {
      const [
        randomNumber,
        completedAt,
      ] = await rngAuctionContracts.rngAuctionContract.callStatic.getRngResults();
      const rngLastAuctionResult = await rngAuctionContracts.rngAuctionContract.getLastAuctionResult();

      // TODO: make sure the elapsed time is less than the auction duration
      const elapsedTime = Math.floor(Date.now() / 1000) - Number(completedAt.toString());

      const rngRelayRewardFraction = await relay.contracts.rngRelayAuctionContract.computeRewardFraction(
        elapsedTime,
      );

      const auctionResult = {
        rewardFraction: rngRelayRewardFraction,
        recipient: rewardRecipient,
      };

      const auctionResults = [];
      auctionResults[0] = rngLastAuctionResult;
      auctionResults[1] = auctionResult;

      console.log(auctionResults);

      const rngRelayExpectedRewardResult = await relay.contracts.rngRelayAuctionContract.callStatic.computeRewards(
        auctionResults,
      );
      rngRelayExpectedReward = rngRelayExpectedRewardResult[1];

      rngRelayExpectedRewardUsd =
        parseFloat(formatUnits(rngRelayExpectedReward.toString(), rewardToken.decimals)) *
        rewardToken.assetRateUsd;
    }

    const context: RelayDrawAuctionContext = {
      prizePoolOpenDrawEndsAt,
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
  console.log('relays.map((relay) => relay.context.rngRelayIsAuctionOpen)');
  console.log(relays.map((relay) => relay.context.rngRelayIsAuctionOpen));
  console.log(
    'relays.map((relay) => relay.context.rngRelayIsAuctionOpen).some((auctionOpen) => !!auctionOpen)',
  );
  console.log(
    relays.map((relay) => relay.context.rngRelayIsAuctionOpen).some((auctionOpen) => !!auctionOpen),
  );
  console.log('anyRelaysOpen');
  console.log(anyRelaysOpen);

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
