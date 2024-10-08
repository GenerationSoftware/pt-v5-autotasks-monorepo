import chalk from 'chalk';
import { ethers, Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';

import { FlashLiquidatorContext, Token, TokenWithRate } from '../types.js';
import { printSpacer, getEthMainnetTokenMarketRateUsd } from './index.js';
import { ERC20Abi } from '../abis/ERC20Abi.js';
import { ERC4626Abi } from '../abis/ERC4626Abi.js';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Gather information about this specific liquidation pair for flash liquidations
 * `tokenIn` is the token to supply (likely the prize token, which is probably POOL),
 * `tokenOut` is either the Vault (vault shares, ERC4626 with .asset() as the underlying ERC20)
 * or a straight up ERC20 token (ie. DAI, USDC)
 *
 * @param liquidationPairContract ethers contract instance of the LiquidationPair contract
 * @param provider provider for the chain that will be queried
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns
 */
export const getFlashLiquidatorContextMulticall = async (
  liquidationPairContract: Contract,
  provider: Provider,
  covalentApiKey?: string,
): Promise<FlashLiquidatorContext> => {
  // @ts-ignore
  const chainId = provider._network.chainId;

  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

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
    console.log(chalk.dim('underlyingAssetAddress 2'));
    console.log(chalk.dim(underlyingAssetAddress));
  }

  const underlyingAssetContract = new ethers.Contract(
    underlyingAssetAddress,
    ERC20Abi,
    multicallProvider,
  );

  queries[`underlyingAsset-decimals`] = underlyingAssetContract.decimals();
  queries[`underlyingAsset-name`] = underlyingAssetContract.name();
  queries[`underlyingAsset-symbol`] = underlyingAssetContract.symbol();

  // 5. Get and process results!
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 1. tokenIn results
  const tokenInAssetRateUsd = await getEthMainnetTokenMarketRateUsd(
    chainId,
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
    chainId,
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

  return {
    tokenIn,
    tokenOut,
    underlyingAssetToken,
  };
};
