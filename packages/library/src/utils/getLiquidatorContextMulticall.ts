import { ethers, Contract, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import {
  LiquidatorConfig,
  LiquidatorContext,
  LiquidatorRelayerContext,
  Token,
  TokenWithRate,
} from '../types.js';
import { getEthMainnetTokenMarketRateUsd } from '../utils/index.js';
import { ERC20Abi } from '../abis/ERC20Abi.js';
import { ERC4626Abi } from '../abis/ERC4626Abi.js';
import { UniswapV2WethPairFlashLiquidatorAbi } from '../abis/UniswapV2WethPairFlashLiquidatorAbi.js';
import {
  LIQUIDATION_TOKEN_ALLOW_LIST,
  UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS,
} from '../constants/index.js';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Gather information about this specific liquidation pair
 * `tokenIn` is the token to supply (likely the prize token, which is probably WETH),
 * `tokenOut` is either the Vault (vault shares, ERC4626 with .asset() as the underlying ERC20)
 * or a straight up ERC20 token (ie. DAI, USDC)
 *
 * @param liquidationRouterContract ethers contract instance for the liquidationRouter contract
 * @param liquidationPairContract ethers contract instance for the liquidationPair contract
 * @param provider provider for the chain that will be queried
 * @param contracts blob of contracts to pull PrizePool abi/etc from
 * @param covalentApiKey (optional) your Covalent API key for getting USD values of tokens
 * @returns
 */
export const getLiquidatorContextMulticall = async (
  config: LiquidatorConfig,
  liquidationRouterContract: Contract,
  liquidationPairContract: Contract,
  provider: Provider,
  relayerAddress: string,
  covalentApiKey?: string,
): Promise<LiquidatorContext> => {
  const { chainId } = config;

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

  // Find out if this LiquidationPair's tokenOut is an ERC4626 Vault or an ERC20 token
  const liquidationPairTokenOutAsVault = new ethers.Contract(
    tokenOutAddress,
    ERC4626Abi,
    multicallProvider,
  );
  let underlyingAssetAddress;
  try {
    underlyingAssetAddress = await liquidationPairTokenOutAsVault.asset();
  } catch (e) {
    console.log(
      chalk.yellow('liquidationPairTokenOutAsVault.asset() test failed, likely an ERC20 token'),
    );
    underlyingAssetAddress = tokenOutAddress;
  }
  const underlyingAssetContract = new ethers.Contract(
    underlyingAssetAddress,
    ERC20Abi,
    multicallProvider,
  );

  queries[`underlyingAsset-decimals`] = underlyingAssetContract.decimals();
  queries[`underlyingAsset-name`] = underlyingAssetContract.name();
  queries[`underlyingAsset-symbol`] = underlyingAssetContract.symbol();

  // 3. RELAYER tokenIn BALANCE
  queries[`tokenIn-balanceOf`] = tokenInContract.balanceOf(relayerAddress);
  queries[`tokenIn-allowance`] = tokenInContract.allowance(
    relayerAddress,
    liquidationRouterContract.address,
  );

  // 4. Query to see if this LP pair is actually for an underlying LP asset that we can flash liquidate
  const uniswapV2WethPairFlashLiquidatorContractAddress =
    UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS[chainId];

  let isValidWethFlashLiquidationPair;
  if (uniswapV2WethPairFlashLiquidatorContractAddress) {
    const uniswapV2WethPairFlashLiquidatorContract = new ethers.Contract(
      UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS[chainId],
      UniswapV2WethPairFlashLiquidatorAbi,
      provider,
    );
    try {
      isValidWethFlashLiquidationPair =
        await uniswapV2WethPairFlashLiquidatorContract.isValidLiquidationPair(
          liquidationPairContract.address,
        );
    } catch (e) {}
  }

  // 5. Get and process results!
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  // 6. tokenOut results (vault token)
  const tokenOut: Token = {
    address: tokenOutAddress,
    decimals: results['tokenOut-decimals'],
    name: results['tokenOut-name'],
    symbol: results['tokenOut-symbol'],
  };

  const tokenOutInAllowList = tokenOutAllowListed(config, tokenOut);

  // 7. tokenIn results
  let tokenInAssetRateUsd;
  if (tokenOutInAllowList && !isValidWethFlashLiquidationPair) {
    tokenInAssetRateUsd = await getEthMainnetTokenMarketRateUsd(
      chainId,
      results['tokenIn-symbol'],
      tokenInAddress,
      covalentApiKey,
    );
  }
  const tokenIn: TokenWithRate = {
    address: tokenInAddress,
    decimals: results['tokenIn-decimals'],
    name: results['tokenIn-name'],
    symbol: results['tokenIn-symbol'],
    assetRateUsd: tokenInAssetRateUsd,
  };

  // 8. vault underlying asset (hard asset such as DAI or USDC) results
  let underlyingAssetAssetRateUsd;
  if (tokenOutInAllowList && !isValidWethFlashLiquidationPair) {
    underlyingAssetAssetRateUsd = await getEthMainnetTokenMarketRateUsd(
      chainId,
      results['underlyingAsset-symbol'],
      underlyingAssetAddress,
      covalentApiKey,
    );
  }

  const underlyingAssetToken: TokenWithRate = {
    address: underlyingAssetAddress,
    decimals: results['underlyingAsset-decimals'],
    name: results['underlyingAsset-name'],
    symbol: results['underlyingAsset-symbol'],
    assetRateUsd: underlyingAssetAssetRateUsd,
  };

  const relayerNativeTokenBalance = await provider.getBalance(relayerAddress);
  const relayer: LiquidatorRelayerContext = {
    nativeTokenBalance: relayerNativeTokenBalance,
    tokenInBalance: BigNumber.from(results['tokenIn-balanceOf']),
    tokenInAllowance: BigNumber.from(results['tokenIn-allowance']),
  };

  return {
    tokenIn,
    tokenOut,
    underlyingAssetToken,
    relayer,
    tokenOutInAllowList,
    isValidWethFlashLiquidationPair,
  };
};

// Checks to see if the LiquidationPair's tokenOut() is a token we are willing to swap for, avoids
// possibility of manually deployed malicious vaults/pairs
const tokenOutAllowListed = (config: LiquidatorConfig, tokenOut: Token) => {
  const { envTokenAllowList, chainId } = config;

  let tokenOutInAllowList = false;
  try {
    tokenOutInAllowList =
      LIQUIDATION_TOKEN_ALLOW_LIST[chainId].includes(tokenOut.address.toLowerCase()) ||
      envTokenAllowList.includes(tokenOut.address.toLowerCase());
  } catch (e) {
    console.error(chalk.red(e));
    console.error(
      chalk.white(`Perhaps chain has not been added to LIQUIDATION_TOKEN_ALLOW_LIST ?`),
    );
  }

  return tokenOutInAllowList;
};
