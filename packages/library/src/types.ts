import { Contract, BigNumber } from 'ethers';
import { BaseProvider, Provider } from '@ethersproject/providers';
import { Relayer } from 'defender-relay-client';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { ContractsBlob, TierPrizeData } from '@generationsoftware/pt-v5-utils-js';

import { DrawAuctionState } from './utils/getDrawAuctionContextMulticall';

export interface ArbLiquidatorRelayerContext {
  tokenInAllowance: BigNumber;
  tokenInBalance: BigNumber;
}

export interface DrawAuctionRelayerContext {
  rngFeeTokenAllowance: BigNumber;
  rngFeeTokenBalance: BigNumber;
}

export interface ProviderOptions {
  chainId: number;
  provider: Provider;
}

export interface Token {
  name: string;
  decimals: number;
  address: string;
  symbol: string;
}

export interface TokenWithRate extends Token {
  assetRateUsd: number;
}

export interface TiersContext {
  numTiers: number;
  tiersRangeArray: number[];
}

export interface ClaimPrizeContext {
  feeToken: TokenWithRate;
  drawId: number;
  isDrawFinalized: boolean;
  tiers: TiersContext;
  tierPrizeData: {
    [tierNum: string]: TierPrizeData;
  };
}

export interface ExecuteClaimerProfitablePrizeTxsParams {
  chainId: number;
  feeRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface ArbLiquidatorConfigParams {
  chainId: number;
  readProvider: BaseProvider;
  writeProvider: Provider | DefenderRelaySigner;
  swapRecipient: string;
  relayerAddress: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface ArbLiquidatorContext {
  tokenIn: TokenWithRate;
  tokenOut: Token;
  underlyingAssetToken: TokenWithRate;
  relayer: ArbLiquidatorRelayerContext;
}

export interface WithdrawClaimRewardsConfigParams {
  chainId: number;
  rewardsRecipient: string;
  relayerAddress: string;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface WithdrawClaimRewardsContext {
  rewardsToken: TokenWithRate;
}

export interface DrawAuctionConfigParams {
  rngChainId: number;
  rngReadProvider: BaseProvider;
  rngWriteProvider: Provider | DefenderRelaySigner;
  rngRelayerAddress: string;
  rewardRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface RngDrawAuctionContext {
  rngFeeTokenIsSet: boolean;
  rngFeeToken: TokenWithRate;
  rngFeeAmount: BigNumber;
  rngFeeUsd: number;
  rngIsAuctionOpen: boolean;
  rngIsRngComplete: boolean;
  rngCurrentFractionalRewardString: string;
  relayer: DrawAuctionRelayerContext;
}

export interface DrawAuctionContext extends RngDrawAuctionContext {
  rngNativeTokenMarketRateUsd: number;
  relays: Relay[];
  drawAuctionState?: DrawAuctionState;
  rngExpectedRewardTotal?: BigNumber; // sum of all rewards from all prize pools
  rngExpectedRewardTotalUsd?: number; // sum of all rewards from all prize pools in USD
}

export interface RngResults {
  randomNumber: BigNumber;
  rngCompletedAt: number;
}

export interface AuctionResult {
  recipient: string;
  rewardFraction: number;
}

export interface RelayDrawAuctionContext {
  prizePoolOpenDrawEndsAt: number;
  rngResults: RngResults;
  rngLastAuctionResult: AuctionResult;
  rngExpectedReward: number; // why is this a number and not a BigNumber like `rngRelayExpectedReward` or `rngExpectedReward`?
  rngExpectedRewardUsd: number;
  rewardToken: TokenWithRate;
  rngRelayIsAuctionOpen: boolean;
  rngRelayExpectedReward: BigNumber;
  rngRelayExpectedRewardUsd: number;
  rngRelayLastSequenceId: number;
  nativeTokenMarketRateUsd?: number;
}

export interface RelayConfig {
  RELAY_CHAIN_ID: string;
  RELAY_RELAYER_API_KEY: string;
  RELAY_RELAYER_API_SECRET: string;
  RELAY_JSON_RPC_URI: string;
}

export interface Relay {
  chainId: number;
  contractsBlob: ContractsBlob;
  relayer: Relayer;
  readProvider: BaseProvider;
  writeProvider: Provider | DefenderRelaySigner;
  contracts?: RelayAuctionContracts;
  context?: RelayDrawAuctionContext;
}

export interface RngAuctionContracts {
  chainlinkVRFV2DirectRngAuctionHelperContract: Contract;
  rngAuctionContract: Contract;
  rngAuctionRelayerRemoteOwnerContracts: Contract[];
  rngAuctionRelayerDirect?: Contract;
}

export interface RelayAuctionContracts {
  prizePoolContract: Contract;
  remoteOwnerContract: Contract;
  rngRelayAuctionContract: Contract;
}

export interface VaultWithContext {
  id: string;
  vaultContract: Contract;
  liquidationPair?: string;
  asset?: string;
}
