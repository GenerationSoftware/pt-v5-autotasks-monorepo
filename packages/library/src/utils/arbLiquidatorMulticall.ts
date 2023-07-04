import { Contract, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { ContractCallContext } from 'ethereum-multicall';
import { getComplexMulticallResults } from '@generationsoftware/pt-v5-utils-js';

import { ContractsBlob, ArbLiquidatorContext, Token, TokenWithRate } from '../types';
import { parseBigNumberAsFloat, MARKET_RATE_CONTRACT_DECIMALS } from '../utils';
import { ERC20Abi } from '../abis/ERC20Abi';

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
export const arbLiquidatorMulticall = async (
  marketRate: Contract,
  liquidationRouter: Contract,
  liquidationPair: Contract,
  contracts: ContractsBlob,
  readProvider: Provider,
  relayerAddress: string,
): Promise<ArbLiquidatorContext> => {
  const tokenInCalls: ContractCallContext['calls'] = [];

  // 1. IN TOKEN
  const tokenInAddress = await liquidationPair.tokenIn();

  tokenInCalls.push({
    reference: `decimals`,
    methodName: 'decimals',
    methodParameters: [],
  });
  tokenInCalls.push({
    reference: `name`,
    methodName: 'name',
    methodParameters: [],
  });
  tokenInCalls.push({
    reference: `symbol`,
    methodName: 'symbol',
    methodParameters: [],
  });

  const tokenOutCalls: ContractCallContext['calls'] = [];

  // 2. OUT TOKEN
  const tokenOutAddress = await liquidationPair.tokenOut();

  tokenOutCalls.push({
    reference: `decimals`,
    methodName: 'decimals',
    methodParameters: [],
  });
  tokenOutCalls.push({
    reference: `name`,
    methodName: 'name',
    methodParameters: [],
  });
  tokenOutCalls.push({
    reference: `symbol`,
    methodName: 'symbol',
    methodParameters: [],
  });

  // // 3. VAULT UNDERLYING ASSET TOKEN
  const vaultUnderlyingAssetCalls: ContractCallContext['calls'] = [];

  const vaultContract = contracts.contracts.find(
    (contract) => contract.type === 'Vault' && contract.address === tokenOutAddress,
  );
  const vaultUnderlyingAsset = vaultContract.tokens[0].extensions.underlyingAsset;
  const vaultUnderlyingAssetAddress = vaultUnderlyingAsset.address;

  vaultUnderlyingAssetCalls.push({
    reference: `decimals`,
    methodName: 'decimals',
    methodParameters: [],
  });
  vaultUnderlyingAssetCalls.push({
    reference: `name`,
    methodName: 'name',
    methodParameters: [],
  });
  vaultUnderlyingAssetCalls.push({
    reference: `symbol`,
    methodName: 'symbol',
    methodParameters: [],
  });

  // // 4. RELAYER tokenIn BALANCE
  tokenInCalls.push({
    reference: `balanceOf`,
    methodName: 'balanceOf',
    methodParameters: [relayerAddress],
  });

  // // 5. RELAYER tokenIn ALLOWANCE for spender LiquidationRouter
  tokenInCalls.push({
    reference: `allowance`,
    methodName: 'allowance',
    methodParameters: [relayerAddress, liquidationRouter.address],
  });

  // 6. MarketRate Calls
  const marketRateCalls: ContractCallContext['calls'] = [];

  // // // prize token/pool
  const marketRateContractBlob = contracts.contracts.find(
    (contract) => contract.type === 'MarketRate',
  );
  const marketRateAddress = marketRate.address;
  marketRateCalls.push({
    reference: `priceFeed-${tokenInAddress}`,
    methodName: 'priceFeed',
    methodParameters: [tokenInAddress, 'USD'],
  });

  // // yield token/vault underlying asset rate
  marketRateCalls.push({
    reference: `priceFeed-${vaultUnderlyingAssetAddress}`,
    methodName: 'priceFeed',
    methodParameters: [vaultUnderlyingAssetAddress, 'USD'],
  });

  const queries: ContractCallContext[] = [
    {
      reference: tokenInAddress,
      contractAddress: tokenInAddress,
      abi: ERC20Abi,
      calls: tokenInCalls,
    },
    {
      reference: tokenOutAddress,
      contractAddress: tokenOutAddress,
      abi: ERC20Abi,
      calls: tokenOutCalls,
    },
    {
      reference: vaultUnderlyingAssetAddress,
      contractAddress: vaultUnderlyingAssetAddress,
      abi: ERC20Abi,
      calls: vaultUnderlyingAssetCalls,
    },
    {
      reference: marketRateAddress,
      contractAddress: marketRateAddress,
      abi: marketRateContractBlob.abi,
      calls: marketRateCalls,
    },
  ];

  // Get and process results!
  const multicallResults = await getComplexMulticallResults(readProvider, queries);

  const marketRateMulticallResults = multicallResults[marketRateAddress];
  const tokenInPriceFeedResults = marketRateMulticallResults[`priceFeed-${tokenInAddress}`][0];

  // 1. tokenIn results
  const tokenInMulticallResults = multicallResults[tokenInAddress];
  const tokenInAssetRateUsd = parseBigNumberAsFloat(
    BigNumber.from(tokenInPriceFeedResults),
    MARKET_RATE_CONTRACT_DECIMALS,
  );
  const tokenIn: TokenWithRate = {
    address: tokenInAddress,
    decimals: tokenInMulticallResults.decimals[0],
    name: tokenInMulticallResults.name[0],
    symbol: tokenInMulticallResults.symbol[0],
    assetRateUsd: tokenInAssetRateUsd,
  };

  // 2. tokenOut results (vault token)
  const tokenOutMulticallResults = multicallResults[tokenOutAddress];
  const tokenOut: Token = {
    address: tokenOutAddress,
    decimals: tokenOutMulticallResults.decimals[0],
    name: tokenOutMulticallResults.name[0],
    symbol: tokenOutMulticallResults.symbol[0],
  };

  // 3. vault underlying asset (hard asset such as DAI or USDC) results
  const vaultUnderlyingAssetMulticallResults = multicallResults[vaultUnderlyingAssetAddress];
  const vaultUnderlyingAssetPriceFeedResults =
    marketRateMulticallResults[`priceFeed-${vaultUnderlyingAssetAddress}`][0];
  const vaultUnderlyingAssetAssetRateUsd = parseBigNumberAsFloat(
    BigNumber.from(vaultUnderlyingAssetPriceFeedResults),
    MARKET_RATE_CONTRACT_DECIMALS,
  );
  const vaultUnderlyingAssetUnderlyingAsset: TokenWithRate = {
    address: vaultUnderlyingAsset.address,
    decimals: vaultUnderlyingAssetMulticallResults.decimals[0],
    name: vaultUnderlyingAssetMulticallResults.name[0],
    symbol: vaultUnderlyingAssetMulticallResults.symbol[0],
    assetRateUsd: vaultUnderlyingAssetAssetRateUsd,
  };

  const relayer = {
    tokenInBalance: BigNumber.from(tokenInMulticallResults.balanceOf[0]),
    tokenInAllowance: BigNumber.from(tokenInMulticallResults.allowance[0]),
  };

  return {
    tokenIn,
    tokenOut,
    tokenOutUnderlyingAsset: vaultUnderlyingAssetUnderlyingAsset,
    relayer,
  };
};
