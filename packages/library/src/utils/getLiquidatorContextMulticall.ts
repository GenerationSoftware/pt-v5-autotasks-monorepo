import { Contract, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import {
  ContractData,
  getEthersMulticallProviderResults,
} from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import { LiquidatorContext, LiquidatorRelayerContext, Token, TokenWithRate } from '../types';
import { printSpacer, getEthMainnetTokenMarketRateUsd } from '../utils';
import { ERC20Abi } from '../abis/ERC20Abi';
import { ERC4626Abi } from '../abis/ERC4626Abi';

import { ethers } from 'ethers';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Gather information about this specific liquidation pair
 * `tokenIn` is the token to supply (likely the prize token, which is probably POOL),
 * `tokenOut` is either the Vault (vault shares, ERC4626 with .asset() as the underlying ERC20)
 * or a straight up ERC20 token (ie. DAI, USDC)
 *
 * @param liquidationRouterContract ethers contract instance for the liquidationRouter contract
 * @param liquidationPairContract ethers contract instance for the liquidationPair contract
 * @param l1Provider provider for the chain that will be queried
 * @param contracts blob of contracts to pull PrizePool abi/etc from
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns
 */
export const getLiquidatorContextMulticall = async (
  liquidationRouterContract: Contract,
  liquidationPairContract: Contract,
  l1Provider: Provider,
  relayerAddress: string,
  covalentApiKey?: string,
): Promise<LiquidatorContext> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(l1Provider);

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

  // Find out if this LiquidationPair's tokenOut is an ERC4626 Vault or a straight-up ERC20 token
  const liquidationPairTokenOutAsVault = new ethers.Contract(
    tokenOutAddress,
    ERC4626Abi,
    multicallProvider,
  );
  let underlyingAssetAddress;
  try {
    underlyingAssetAddress = await liquidationPairTokenOutAsVault.asset();
    console.log(chalk.dim('Underlying Asset Address:'));
    console.log(chalk.dim(underlyingAssetAddress));
  } catch (e) {
    // console.error(e);
    // console.log('---');
    // console.error(e);
  }

  if (!underlyingAssetAddress) {
    underlyingAssetAddress = tokenOutAddress;

    console.log('underlyingAssetAddress 2');
    console.log(underlyingAssetAddress);
  }

  const underlyingAssetContract = new ethers.Contract(
    underlyingAssetAddress,
    ERC20Abi,
    multicallProvider,
  );

  queries[`underlyingAsset-decimals`] = underlyingAssetContract.decimals();
  queries[`underlyingAsset-name`] = underlyingAssetContract.name();
  queries[`underlyingAsset-symbol`] = underlyingAssetContract.symbol();

  // 4. RELAYER tokenIn BALANCE
  queries[`tokenIn-balanceOf`] = tokenInContract.balanceOf(relayerAddress);
  queries[`tokenIn-allowance`] = tokenInContract.allowance(
    relayerAddress,
    liquidationRouterContract.address,
  );

  // 5. Get and process results!
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 1. tokenIn results
  const tokenInAssetRateUsd = await getEthMainnetTokenMarketRateUsd(
    results['tokenIn-symbol'],
    tokenInAddress,
    covalentApiKey,
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
  const underlyingAssetAssetRateUsd = await getEthMainnetTokenMarketRateUsd(
    results['underlyingAsset-symbol'],
    underlyingAssetAddress,
    covalentApiKey,
  );

  const underlyingAssetToken: TokenWithRate = {
    address: underlyingAssetAddress,
    decimals: results['underlyingAsset-decimals'],
    name: results['underlyingAsset-name'],
    symbol: results['underlyingAsset-symbol'],
    assetRateUsd: underlyingAssetAssetRateUsd,
  };

  const relayer: LiquidatorRelayerContext = {
    tokenInBalance: BigNumber.from(results['tokenIn-balanceOf']),
    tokenInAllowance: BigNumber.from(results['tokenIn-allowance']),
  };

  return {
    tokenIn,
    tokenOut,
    underlyingAssetToken,
    relayer,
  };
};
