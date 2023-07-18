import { Contract, BigNumber } from 'ethers';
import { BaseProvider, Provider } from '@ethersproject/providers';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

export interface RelayerContext {
  tokenInAllowance: BigNumber;
  tokenInBalance: BigNumber;
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
}

export interface ArbLiquidatorConfigParams {
  chainId: number;
  readProvider: BaseProvider;
  writeProvider: Provider | DefenderRelaySigner;
  swapRecipient: string;
  relayerAddress: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
}

export interface ArbLiquidatorContext {
  tokenIn: TokenWithRate;
  tokenOut: Token;
  tokenOutUnderlyingAsset: TokenWithRate;
  relayer: RelayerContext;
}

export interface WithdrawClaimRewardsConfigParams {
  chainId: number;
  rewardsRecipient: string;
  relayerAddress: string;
  minProfitThresholdUsd: number;
}

export interface WithdrawClaimRewardsContext {
  rewardsToken: TokenWithRate;
}

export interface DrawAuctionConfigParams {
  chainId: number;
  rewardRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
}

export interface DrawAuctionContext {
  gasTokenMarketRateUsd: number;
  isRNGAuctionOpen: boolean;
  currentRewardPortionRng: number;
  rewardToken: TokenWithRate;
}

export interface AuctionContracts {
  prizePoolContract: Contract;
  rngAuctionContract: Contract;
  drawAuctionContract: Contract;
  marketRateContract: Contract;
}
