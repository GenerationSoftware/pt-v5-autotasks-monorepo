import { Contract, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import {
  ContractsBlob,
  getEthersMulticallProviderResults,
} from '@generationsoftware/pt-v5-utils-js';

import { ArbLiquidatorContext, ArbLiquidatorRelayerContext, Token, TokenWithRate } from '../types';
import { parseBigNumberAsFloat, MARKET_RATE_CONTRACT_DECIMALS } from '../utils';
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
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param contracts blob of contracts to pull PrizePool abi/etc from
 * @param vaults vaults to query through
 * @returns
 */
export const getArbLiquidatorContextMulticall = async (
  marketRate: Contract,
  liquidationRouter: Contract,
  liquidationPair: Contract,
  contracts: ContractsBlob,
  readProvider: Provider,
  relayerAddress: string,
): Promise<ArbLiquidatorContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(readProvider);

  let queries: Record<string, any> = {};

  // 1. IN TOKEN
  const tokenInAddress = await liquidationPair.tokenIn();
  const tokenInContract = new ethers.Contract(tokenInAddress, ERC20Abi, multicallProvider);

  queries[`tokenIn-decimals`] = tokenInContract.decimals();
  queries[`tokenIn-name`] = tokenInContract.name();
  queries[`tokenIn-symbol`] = tokenInContract.symbol();

  // 2. OUT TOKEN
  const tokenOutAddress = await liquidationPair.tokenOut();
  const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20Abi, multicallProvider);

  queries[`tokenOut-decimals`] = tokenOutContract.decimals();
  queries[`tokenOut-name`] = tokenOutContract.name();
  queries[`tokenOut-symbol`] = tokenOutContract.symbol();

  // // 3. VAULT UNDERLYING ASSET TOKEN
  const vaultContract = contracts.contracts.find(
    (contract) => contract.type === 'Vault' && contract.address === tokenOutAddress,
  );
  const vaultUnderlyingAsset = vaultContract.tokens[0].extensions.underlyingAsset;
  const vaultUnderlyingAssetAddress = vaultUnderlyingAsset.address;

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
    liquidationRouter.address,
  );

  // 5. RELAYER tokenIn ALLOWANCE for spender LiquidationRouter

  // 6. MarketRate Calls

  const marketRateContractBlob = contracts.contracts.find(
    (contract) => contract.type === 'MarketRate',
  );
  const marketRateAddress = marketRate.address;
  const marketRateContract = new ethers.Contract(
    marketRateAddress,
    marketRateContractBlob.abi,
    multicallProvider,
  );

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
    address: vaultUnderlyingAsset.address,
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
