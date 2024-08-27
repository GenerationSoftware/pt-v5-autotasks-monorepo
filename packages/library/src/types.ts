import { Contract, BigNumber, Wallet, Signer } from 'ethers';
import { BaseProvider, Provider } from '@ethersproject/providers';
import { TierPrizeData } from '@generationsoftware/pt-v5-utils-js';

import { DrawAuctionState } from './utils/getDrawAuctionContextMulticall.js';

export interface LiquidatorRelayerContext {
  nativeTokenBalance: BigNumber;
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

export interface TokenWithRateAndTotalSupply extends TokenWithRate {
  totalSupply: BigNumber;
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

export interface AutotaskConfig {
  chainId: number;
  provider: BaseProvider;
  minProfitThresholdUsd: number;
  wallet: Wallet;
  relayerAddress: string;
  signer: Signer;
  contractJsonUrl: string;
  covalentApiKey?: string;
}

export interface PrizeClaimerConfig extends AutotaskConfig {
  subgraphUrl: string;
  rewardRecipient?: string;
}

export interface SharedLiquidatorConfig extends AutotaskConfig {
  swapRecipient?: string;
}

export interface LiquidatorConfig extends SharedLiquidatorConfig {
  envTokenAllowList: string[];
  pairsToLiquidate: string[];
}

export interface FlashLiquidatorConfig extends SharedLiquidatorConfig {}

export interface DrawAuctionConfig extends AutotaskConfig {
  errorStateMaxGasCostThresholdUsd: number;
  rewardRecipient?: string;
}

export type LpToken = {
  contract: Contract;
  token0: TokenWithRate;
  token1: TokenWithRate;
  totalSupply: BigNumber;
  reserves: [BigNumber, BigNumber];
  lpTokenAddresses: {
    token0Address: string;
    token1Address: string;
  };
  assetRateUsd: number;
};

export interface BaseLiquidatorContext {
  tokenIn: TokenWithRate;
  tokenOut: Token;
  underlyingAssetToken: TokenWithRate;
}

export interface FlashLiquidatorContext extends BaseLiquidatorContext {}

export interface LiquidatorContext extends BaseLiquidatorContext {
  relayer: LiquidatorRelayerContext;
  tokenOutInAllowList: boolean;
  isValidWethFlashLiquidationPair: boolean;
  lpToken?: LpToken;
}

export interface AutotaskEnvVars {
  CHAIN_ID: number;
  JSON_RPC_URL: string;
  MIN_PROFIT_THRESHOLD_USD: string;
  CUSTOM_RELAYER_PRIVATE_KEY: string;
  CONTRACT_JSON_URL: string;
  COVALENT_API_KEY?: string;
}

export interface DrawAuctionEnvVars extends AutotaskEnvVars {
  REWARD_RECIPIENT: string;
  ERROR_STATE_MAX_GAS_COST_THRESHOLD_USD: number;
}

export interface SharedLiquidatorEnvVars extends AutotaskEnvVars {
  SWAP_RECIPIENT: string;
}

export interface LiquidatorEnvVars extends SharedLiquidatorEnvVars {
  ENV_TOKEN_ALLOW_LIST?: string[];
  PAIRS_TO_LIQUIDATE?: string[];
}

export interface FlashLiquidatorEnvVars extends SharedLiquidatorEnvVars {}

export interface PrizeClaimerEnvVars extends AutotaskEnvVars {
  SUBGRAPH_URL: string;
  REWARD_RECIPIENT: string;
}

export interface DrawAuctionContext {
  canStartDraw: boolean;
  startDrawReward: BigNumber;
  startDrawRewardUsd: number;

  canFinishDraw: boolean;
  finishDrawReward: BigNumber;
  finishDrawRewardUsd: number;

  rngFeeEstimate: BigNumber;
  rngFeeEstimateUsd: number;

  drawId: number;
  prizePoolDrawClosesAt: number;
  rewardToken: TokenWithRate;

  startDrawError: boolean;

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
  maxPriorityFeePerGas?: BigNumber;
  maxFeePerGas?: BigNumber;
  gasPrice?: BigNumber;
  value?: BigNumber;
}

export type LiquidationPair = {
  chainId: number;
  address: string;
  swapPath: SwapPath;
  swapPathEncoded: string;
};

export type LiquidationPairs = {
  [key: string]: LiquidationPair[];
};

export type SwapPath =
  | [string, number, string]
  | [string, number, string, number, string]
  | [string, number, string, number, string, number, string];
