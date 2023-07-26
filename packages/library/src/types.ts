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
  numberOfTiers: number;
  rangeArray: number[];
}

export interface ClaimPrizeContext {
  feeToken: Token;
  drawId: number;
  feeTokenRateUsd: number;
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
  tokenOutUnderlyingAsset: TokenWithRate;
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
  chainId: number;
  readProvider: BaseProvider;
  writeProvider: Provider | DefenderRelaySigner;
  relayerAddress: string;
  rewardRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface DrawAuctionContext {
  prizePoolReserve: BigNumber;
  nativeTokenMarketRateUsd: number;
  rewardToken: TokenWithRate;
  rngFeeToken: Token;
  rngFeeAmount: BigNumber;
  rngIsAuctionOpen: boolean;
  rngExpectedReward: BigNumber;
  rngExpectedRewardUsd: number;
  drawIsAuctionOpen: boolean;
  drawExpectedReward: BigNumber;
  drawExpectedRewardUsd: number;
  relayer: DrawAuctionRelayerContext;
}

export interface AuctionContracts {
  prizePoolContract: Contract;
  rngAuctionContract: Contract;
  drawAuctionContract: Contract;
  marketRateContract: Contract;
}
