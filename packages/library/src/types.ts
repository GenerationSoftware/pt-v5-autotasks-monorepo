import { Contract, BigNumber, Wallet, Signer } from 'ethers';
import { BaseProvider, Provider } from '@ethersproject/providers';
import { TierPrizeData } from '@generationsoftware/pt-v5-utils-js';

import { DrawAuctionState } from './utils/getDrawAuctionContextMulticall.js';

export interface LiquidatorRelayerContext {
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
  numTiers: number;
  tiersRangeArray: number[];
}

export interface ClaimPrizeContext {
  prizeToken: TokenWithRate;
  drawId: number;
  isDrawFinalized: boolean;
  tiers: TiersContext;
  tierPrizeData: {
    [tierNum: string]: TierPrizeData;
  };
}

// TODO: Inherit from AutotaskConfig
export interface PrizeClaimerConfig {
  chainId: number;
  provider: BaseProvider;
  wallet: Wallet;
  relayerAddress: string;
  signer: Signer;
  rewardRecipient: string;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

// TODO: Inherit from AutotaskConfig
export interface LiquidatorConfig {
  chainId: number;
  provider: BaseProvider;
  wallet: Wallet;
  relayerAddress: string;
  signer: Signer;
  swapRecipient: string;
  minProfitThresholdUsd: number;
  envTokenAllowList: string[];
  covalentApiKey?: string;
}

export interface FlashLiquidatorConfig extends LiquidatorConfig {}

export interface BaseLiquidatorContext {
  tokenIn: TokenWithRate;
  tokenOut: Token;
  underlyingAssetToken: TokenWithRate;
}

export interface LiquidatorContext extends BaseLiquidatorContext {
  relayer: LiquidatorRelayerContext;
}

export interface FlashLiquidatorContext extends BaseLiquidatorContext {}

export interface AutotaskEnvVars {
  CHAIN_ID: number;
  JSON_RPC_URI: string;
  MIN_PROFIT_THRESHOLD_USD: string;
  CUSTOM_RELAYER_PRIVATE_KEY: string;
  COVALENT_API_KEY?: string;
  ARBITRUM_JSON_RPC_URI?: string;
  OPTIMISM_JSON_RPC_URI?: string;
  ARBITRUM_SEPOLIA_JSON_RPC_URI?: string;
  OPTIMISM_SEPOLIA_JSON_RPC_URI?: string;
  OPTIMISM_GOERLI_JSON_RPC_URI?: string;
}

export interface DrawAuctionEnvVars extends AutotaskEnvVars {
  REWARD_RECIPIENT: string;
}

export interface SharedLiquidatorEnvVars extends AutotaskEnvVars {
  SWAP_RECIPIENT: string;
}

export interface LiquidatorEnvVars extends SharedLiquidatorEnvVars {
  ENV_TOKEN_ALLOW_LIST: string[];
}

export interface FlashLiquidatorEnvVars extends SharedLiquidatorEnvVars {}

export interface PrizeClaimerEnvVars extends AutotaskEnvVars {
  REWARD_RECIPIENT: string;
}

export interface AutotaskConfig {
  chainId: number;
  provider: BaseProvider;
  rewardRecipient: string;
  minProfitThresholdUsd: number;
  wallet: Wallet;
  relayerAddress: string;
  signer: Signer;
  covalentApiKey?: string;
}

export interface DrawAuctionConfig extends AutotaskConfig {}

export interface DrawAuctionContext {
  canStartDraw: boolean;
  startDrawReward: BigNumber;
  startDrawRewardUsd: number;

  canFinishDraw: boolean;
  finishDrawReward: BigNumber;
  finishDrawRewardUsd: number;

  rngFeeEstimate: BigNumber;
  rngFeeEstimateUsd: number;

  prizePoolDrawClosesAt: number;
  // auctionClosesSoon: boolean;
  rewardToken: TokenWithRate;

  nativeTokenMarketRateUsd?: number;

  drawAuctionState?: DrawAuctionState;
}

export interface RngResults {
  randomNumber: BigNumber;
  rngCompletedAt: number;
}

export interface AuctionResult {
  recipient: string;
  rewardFraction: number;
}

export interface RelayerAccount {
  signer: Signer;
  relayerAddress: string;
  wallet: Wallet;
}

export interface DrawAuctionContracts {
  prizePoolContract: Contract;
  drawManagerContract: Contract;
  rngWitnetContract?: Contract;
  rngBlockhashContract?: Contract;
}

export interface SendTransactionArgs {
  data: string;
  to: string;
  gasLimit: number;
}

export interface WalletSendTransactionArgs extends SendTransactionArgs {
  gasPrice?: BigNumber;
  value?: BigNumber;
}

export interface OzSendTransactionArgs extends SendTransactionArgs {
  gasPrice?: string;
  value?: BigNumber;
}

export interface LiquidationPair {
  chainId: number;
  address: string;
  swapPath: SwapPath;
  swapPathEncoded: string;
}

export type SwapPath =
  | [string, number, string]
  | [string, number, string, number, string]
  | [string, number, string, number, string, number, string];
