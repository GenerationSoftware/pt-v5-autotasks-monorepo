import { Contract, BigNumber, Wallet, Signer } from 'ethers';
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

export interface PrizeClaimerConfigParams {
  chainId: number;
  readProvider: BaseProvider;
  wallet: Wallet;
  ozRelayer: Relayer;
  relayerAddress: string;
  signer: DefenderRelaySigner | Signer;
  feeRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface ArbLiquidatorConfigParams {
  chainId: number;
  readProvider: BaseProvider;
  writeProvider: Provider | DefenderRelaySigner;
  wallet: Wallet;
  ozRelayer: Relayer;
  relayerAddress: string;
  signer: DefenderRelaySigner | Signer;
  swapRecipient: string;
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

export interface BasicBotConfigParams {
  chainId: number;
  readProvider: BaseProvider;
  useFlashbots: boolean;
  rewardRecipient: string;
  minProfitThresholdUsd: number;

  customRelayerPrivateKey?: string;
  relayerApiKey?: string;
  relayerApiSecret?: string;
  covalentApiKey?: string;
}

export interface DrawAuctionConfigParams extends BasicBotConfigParams {
  rngWallet: Wallet;
  rngOzRelayer: Relayer;
  rngRelayerAddress: string;
  signer: DefenderRelaySigner | Signer;

  relayChainIds: Array<number>;
  arbitrumRelayJsonRpcUri: string;
  optimismRelayJsonRpcUri: string;
  arbitrumSepoliaRelayJsonRpcUri: string;
  optimismSepoliaRelayJsonRpcUri: string;
}

export interface RngDrawAuctionContext {
  rngFeeTokenIsSet: boolean;
  rngFeeToken: TokenWithRate;
  rngFeeAmount: BigNumber;
  rngFeeUsd: number;
  rngIsAuctionOpen: boolean;
  rngIsRngComplete: boolean;
  rngCurrentFractionalRewardString: string;
  rngRelayer: DrawAuctionRelayerContext;
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
  prizePoolDrawClosesAt: number;
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

export interface Relay {
  chainId: number;
  contractsBlob: ContractsBlob;
  // relayerAddress: string;
  readProvider: BaseProvider;
  writeProvider: Provider | DefenderRelaySigner;
  contracts?: RelayAuctionContracts;
  context?: RelayDrawAuctionContext;
}

export interface RelayerAccount {
  signer: DefenderRelaySigner | Signer;
  relayerAddress: string;
  ozRelayer: Relayer;
  wallet: Wallet;
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

export interface YieldVaultMintRateConfigParams {
  chainId: number;
  wallet: Wallet;
  ozRelayer: Relayer;
  readProvider: BaseProvider;
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
