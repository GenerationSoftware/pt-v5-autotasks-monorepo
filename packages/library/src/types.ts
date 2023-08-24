import { Contract, BigNumber } from 'ethers';
import { BaseProvider, Provider } from '@ethersproject/providers';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

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
  tiers: TiersContext;
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
  relayChainId: number;
  rngReadProvider: BaseProvider;
  relayReadProvider: BaseProvider;
  rngWriteProvider: Provider | DefenderRelaySigner;
  relayWriteProvider: Provider | DefenderRelaySigner;
  relayerAddress: string;
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
  rngExpectedReward: BigNumber;
  relayer: DrawAuctionRelayerContext;
}

export interface RelayDrawAuctionContext {
  prizePoolOpenDrawEndsAt: number;
  rewardToken: TokenWithRate;
  rngRelayIsAuctionOpen: boolean;
  rngRelayExpectedReward: BigNumber;
  rngRelayExpectedRewardUsd: number;
  rngRelayLastSequenceId: number;
}

export interface DrawAuctionContext extends RngDrawAuctionContext, RelayDrawAuctionContext {
  rngNativeTokenMarketRateUsd: number;
  relayNativeTokenMarketRateUsd: number;
  rngExpectedRewardUsd?: number;
}

export interface AuctionContracts {
  prizePoolContract: Contract;
  chainlinkVRFV2DirectRngAuctionHelperContract: Contract;
  remoteOwnerContract: Contract;
  rngAuctionContract: Contract;
  rngRelayAuctionContract: Contract;
  rngAuctionRelayerRemoteOwnerContract: Contract;
  rngAuctionRelayerDirect?: Contract;
}

export interface VaultWithContext {
  id: string;
  vaultContract: Contract;
  liquidationPair?: string;
  asset?: string;
}
