import { Contract, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import {
  ArbLiquidatorContext,
  ArbLiquidatorRelayerContext,
  VaultPopulated,
  Token,
  TokenWithRate,
} from '../types';
import { parseBigNumberAsFloat, MARKET_RATE_CONTRACT_DECIMALS, printSpacer } from '../utils';
import { ERC20Abi } from '../abis/ERC20Abi';

import { ethers } from 'ethers';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Gather information about this specific liquidation pair
 * `tokenIn` is the token to supply (likely the prize token, which is probably POOL),
 * This gets complicated because `tokenOut` is the Vault/Yield token, not the underlying
 * asset which is likely the desired token (ie. DAI, USDC) - the desired
 * token is called `tokenOutUnderlyingAsset`
 *
 * @param marketRateContract ethers contract instance for the marketRate contract
 * @param liquidationRouterContract ethers contract instance for the liquidationRouter contract
 * @param liquidationPairContract ethers contract instance for the liquidationPair contract
 * @param vaultUnderlyingAssetAddress address of the original ERC20 which the interest-bearing token is tied to
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param contracts blob of contracts to pull PrizePool abi/etc from
 * @returns
 */
export const getArbLiquidatorContextMulticall = async (
  marketRateContract: Contract,
  liquidationRouterContract: Contract,
  liquidationPairContract: Contract,
  vaultUnderlyingAssetAddress: string,
  readProvider: Provider,
  relayerAddress: string,
): Promise<ArbLiquidatorContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(readProvider);

  let queries: Record<string, any> = {};

  // 1. IN TOKEN
  const tokenInAddress = await liquidationPairContract.tokenIn();
  const tokenInContract = new ethers.Contract(tokenInAddress, ERC20Abi, multicallProvider);

  queries[`tokenIn-decimals`] = tokenInContract.decimals();
  queries[`tokenIn-name`] = tokenInContract.name();
  queries[`tokenIn-symbol`] = tokenInContract.symbol();

  // 2. OUT TOKEN
  const tokenOutAddress = await liquidationPairContract.tokenOut();
  const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20Abi, multicallProvider);

  queries[`tokenOut-decimals`] = tokenOutContract.decimals();
  queries[`tokenOut-name`] = tokenOutContract.name();
  queries[`tokenOut-symbol`] = tokenOutContract.symbol();

  printSpacer();
  printSpacer();

  const vaultUnderlyingAssetContract = new ethers.Contract(
    vaultUnderlyingAssetAddress,
    ERC20Abi,
    multicallProvider,
  );

  queries[`vaultUnderlyingAsset-decimals`] = vaultUnderlyingAssetContract.decimals();
  queries[`vaultUnderlyingAsset-name`] = vaultUnderlyingAssetContract.name();
  queries[`vaultUnderlyingAsset-symbol`] = vaultUnderlyingAssetContract.symbol();

  // 4. RELAYER tokenIn BALANCE
  queries[`tokenIn-balanceOf`] = tokenInContract.balanceOf(relayerAddress);
  queries[`tokenIn-allowance`] = tokenInContract.allowance(
    relayerAddress,
    liquidationRouterContract.address,
  );

  // 5. RELAYER tokenIn ALLOWANCE for spender LiquidationRouter

  // 6. MarketRate Calls
  queries[`priceFeed-${tokenInAddress}`] = marketRateContract.priceFeed(tokenInAddress, 'USD');
  queries[`priceFeed-${vaultUnderlyingAssetAddress}`] = marketRateContract.priceFeed(
    vaultUnderlyingAssetAddress,
    'USD',
  );

  // 7. Get and process results!
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // const marketRateMulticallResults = results[marketRateAddress];
  const tokenInPriceFeedResults = results[`priceFeed-${tokenInAddress}`];

  // 1. tokenIn results
  const tokenInAssetRateUsd = parseBigNumberAsFloat(
    BigNumber.from(tokenInPriceFeedResults),
    MARKET_RATE_CONTRACT_DECIMALS,
  );
  const tokenIn: TokenWithRate = {
    address: tokenInAddress,
    decimals: results['tokenIn-decimals'],
    name: results['tokenIn-name'],
    symbol: results['tokenIn-symbol'],
    assetRateUsd: tokenInAssetRateUsd,
  };

  // 2. tokenOut results (vault token)
  const tokenOut: Token = {
    address: tokenOutAddress,
    decimals: results['tokenOut-decimals'],
    name: results['tokenOut-name'],
    symbol: results['tokenOut-symbol'],
  };

  // 3. vault underlying asset (hard asset such as DAI or USDC) results
  const vaultUnderlyingAssetPriceFeedResults = results[`priceFeed-${vaultUnderlyingAssetAddress}`];
  const vaultUnderlyingAssetAssetRateUsd = parseBigNumberAsFloat(
    BigNumber.from(vaultUnderlyingAssetPriceFeedResults),
    MARKET_RATE_CONTRACT_DECIMALS,
  );
  const vaultUnderlyingAssetUnderlyingAsset: TokenWithRate = {
    address: vaultUnderlyingAssetAddress,
    decimals: results['vaultUnderlyingAsset-decimals'],
    name: results['vaultUnderlyingAsset-name'],
    symbol: results['vaultUnderlyingAsset-symbol'],
    assetRateUsd: vaultUnderlyingAssetAssetRateUsd,
  };

  const relayer: ArbLiquidatorRelayerContext = {
    tokenInBalance: BigNumber.from(results['tokenIn-balanceOf']),
    tokenInAllowance: BigNumber.from(results['tokenIn-allowance']),
  };

  return {
    tokenIn,
    tokenOut,
    tokenOutUnderlyingAsset: vaultUnderlyingAssetUnderlyingAsset,
    relayer,
  };
};
