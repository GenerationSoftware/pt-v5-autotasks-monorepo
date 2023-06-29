import { BigNumber } from 'ethers';
import { BaseProvider, Provider } from '@ethersproject/providers';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

// Config types
export interface Token {
  name: string;
  decimals: number;
  address: string;
  symbol: string;
}

export interface TokenWithRate extends Token {
  assetRateUsd: number;
}

export interface TokenData {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  extensions: {
    underlyingAsset: {
      address: string;
      symbol: string;
      name: string;
    };
  };
}

export interface ContractData {
  address: string;
  chainId: number;
  type: string;
  abi: any;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens?: TokenData[];
}

export interface ContractsBlob {
  name: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  timestamp: string;
  contracts: ContractData[];
}

export interface ProviderOptions {
  chainId: number;
  provider: Provider;
}

export interface Vault {
  id: string;
  accounts: VaultAccount[];
}

export interface VaultAccount {
  id: string;
}

export interface TiersContext {
  numberOfTiers: number;
  rangeArray: number[];
}

export interface ClaimPrizeContext {
  feeToken: Token;
  drawId: string;
  feeTokenRateUsd: number;
  tiers: TiersContext;
}

export interface GetClaimerProfitablePrizeTxsParams {
  chainId: number;
  feeRecipient: string;
}

export interface RelayerContext {
  tokenInAllowance: BigNumber;
  tokenInBalance: BigNumber;
}

export interface ArbLiquidatorConfigParams {
  useFlashbots: boolean;
  swapRecipient: string;
  relayerAddress: string;
  chainId: number;
  readProvider: BaseProvider;
  writeProvider: Provider | DefenderRelaySigner;
}

export interface ArbLiquidatorContext {
  tokenIn: TokenWithRate;
  tokenOut: Token;
  tokenOutUnderlyingAsset: TokenWithRate;
  relayer: RelayerContext;
}

export interface PrizeClaimerConfigParams {
  useFlashbots: boolean;
  feeRecipient: string;
  chainId: number;
}

export interface WithdrawClaimRewardsConfigParams {
  relayerAddress: string;
  rewardsRecipient: string;
  chainId: number;
}

export interface WithdrawClaimRewardsContext {
  rewardsToken: TokenWithRate;
}

export interface DrawReserveConfigParams {
  relayerAddress: string;
  reserveRecipient: string;
  chainId: number;
}

export interface DrawReserveContext {
  reserveToken: TokenWithRate;
}
