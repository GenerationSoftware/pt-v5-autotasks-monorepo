import { Contract, BigNumber, Wallet, Signer } from 'ethers';
import { BaseProvider, Provider } from '@ethersproject/providers';
import { Relayer } from 'defender-relay-client';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { ContractVersion, ContractsBlob, TierPrizeData } from '@generationsoftware/pt-v5-utils-js';

import { DrawAuctionState } from './utils/getDrawAuctionContextMulticall';

export interface LiquidatorRelayerContext {
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
  contractVersion: ContractVersion;
  wallet: Wallet;
  ozRelayer: Relayer;
  relayerAddress: string;
  signer: DefenderRelaySigner | Signer;
  rewardRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

// TODO: Inherit from AutotaskConfig
export interface LiquidatorConfig {
  chainId: number;
  provider: BaseProvider;
  contractVersion: ContractVersion;
  wallet: Wallet;
  ozRelayer: Relayer;
  relayerAddress: string;
  signer: DefenderRelaySigner | Signer;
  swapRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
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
  CONTRACT_VERSION: ContractVersion;
  USE_FLASHBOTS: boolean;
  MIN_PROFIT_THRESHOLD_USD: string;
  COVALENT_API_KEY?: string;
  CUSTOM_RELAYER_PRIVATE_KEY?: string;
  RELAYER_API_KEY?: string;
  RELAYER_API_SECRET?: string;
  ARBITRUM_JSON_RPC_URI?: string;
  OPTIMISM_JSON_RPC_URI?: string;
  ARBITRUM_SEPOLIA_JSON_RPC_URI?: string;
  OPTIMISM_SEPOLIA_JSON_RPC_URI?: string;
}

export interface DrawAuctionEnvVars extends AutotaskEnvVars {
  REWARD_RECIPIENT: string;
}

export interface LiquidatorEnvVars extends AutotaskEnvVars {
  SWAP_RECIPIENT: string;
}

export interface FlashLiquidatorEnvVars extends LiquidatorEnvVars {}

export interface PrizeClaimerEnvVars extends AutotaskEnvVars {
  REWARD_RECIPIENT: string;
}

export interface AutotaskConfig {
  chainId: number;
  provider: BaseProvider;
  contractVersion: ContractVersion;
  useFlashbots: boolean;
  rewardRecipient: string;
  minProfitThresholdUsd: number;

  customRelayerPrivateKey?: string;
  relayerApiKey?: string;
  relayerApiSecret?: string;
  covalentApiKey?: string;
  rngWallet: Wallet;
  rngOzRelayer: Relayer;
  rngRelayerAddress: string;
  signer: DefenderRelaySigner | Signer;

  arbitrumRelayJsonRpcUri?: string;
  optimismRelayJsonRpcUri?: string;
  arbitrumSepoliaRelayJsonRpcUri?: string;
  optimismSepoliaRelayJsonRpcUri?: string;
}

export interface DrawAuctionConfig extends AutotaskConfig {}

export interface DrawAuctionContext {
  rngFeeTokenIsSet: boolean;
  rngFeeToken: TokenWithRate;
  rngFeeAmount: BigNumber;
  rngFeeUsd: number;
  rngIsAuctionOpen: boolean;
  rngIsRngComplete: boolean;
  rngCurrentFractionalRewardString: string;
  rngRelayer: DrawAuctionRelayerContext;

  prizePoolDrawClosesAt: number;
  auctionClosesSoon: boolean;
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

export interface RelayerAccount {
  signer: DefenderRelaySigner | Signer;
  relayerAddress: string;
  ozRelayer: Relayer;
  wallet: Wallet;
}

export interface RngAuctionContracts {
  prizePoolContract: Contract;
  rngAuctionContract: Contract;
  rngRelayAuctionContract: Contract;
  rngAuctionRelayerDirectContract: Contract;
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

// TODO: Inherit from AutotaskConfig
export interface YieldVaultMintRateConfig {
  chainId: number;
  wallet: Wallet;
  ozRelayer: Relayer;
  provider: BaseProvider;
  relayerAddress: string;
  signer: DefenderRelaySigner | Signer;
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
  isPrivate?: boolean;
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
