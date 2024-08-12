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
  TokenWithRateAndTotalSupply,
} from '../types.js';
import { getEthMainnetTokenMarketRateUsd, printSpacer } from '../utils/index.js';
import { LPTokenAbi } from '../abis/LPTokenAbi.js';
import { ERC20Abi } from '../abis/ERC20Abi.js';
import { ERC4626Abi } from '../abis/ERC4626Abi.js';
import { UniswapV2WethPairFlashLiquidatorAbi } from '../abis/UniswapV2WethPairFlashLiquidatorAbi.js';
import {
  LIQUIDATION_TOKEN_ALLOW_LIST,
  UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS,
} from '../constants/index.js';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

type LpTokenAddresses = {
  token0: string;
  token1: string;
};

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
 * @param covalentApiKey a Covalent API key for getting USD values of tokens
 * @returns
 */
export const getLiquidatorContextMulticall = async (
  config: LiquidatorConfig,
  liquidationRouterContract: Contract,
  liquidationPairContract: Contract,
  provider: Provider,
  relayerAddress: string,
  covalentApiKey: string,
): Promise<LiquidatorContext> => {
  const { chainId } = config;

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

  const underlyingAsset = await getUnderlyingAsset(multicallProvider, tokenOutAddress);
  const underlyingAssetContract = underlyingAsset.contract;
  const underlyingAssetAddress = underlyingAssetContract.address;

  queries[`underlyingAsset-decimals`] = underlyingAssetContract.decimals();
  queries[`underlyingAsset-name`] = underlyingAssetContract.name();
  queries[`underlyingAsset-symbol`] = underlyingAssetContract.symbol();

  if (underlyingAssetIsLpToken(underlyingAsset)) {
    queries[`underlyingAsset-totalSupply`] = underlyingAssetContract.totalSupply();

    const token0Contract = new ethers.Contract(
      underlyingAsset.lpTokenAddresses.token0,
      ERC20Abi,
      multicallProvider,
    );
    queries[`token0-decimals`] = token0Contract.decimals();
    queries[`token0-name`] = token0Contract.name();
    queries[`token0-symbol`] = token0Contract.symbol();
    queries[`token0-totalSupply`] = token0Contract.totalSupply();

    const token1Contract = new ethers.Contract(
      underlyingAsset.lpTokenAddresses.token1,
      ERC20Abi,
      multicallProvider,
    );
    queries[`token1-decimals`] = token1Contract.decimals();
    queries[`token1-name`] = token1Contract.name();
    queries[`token1-symbol`] = token1Contract.symbol();
    queries[`token1-totalSupply`] = token1Contract.totalSupply();
  }

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

  const tokenOutInAllowList = tokenAllowListed(config, tokenOut);

  // 7. tokenIn results
  let tokenInAssetRateUsd;
  if (tokenOutInAllowList && !isValidWethFlashLiquidationPair) {
    tokenInAssetRateUsd = await getEthMainnetTokenMarketRateUsd(
      chainId,
      covalentApiKey,
      results['tokenIn-symbol'],
      tokenInAddress,
    );
  }
  const tokenIn: TokenWithRate = {
    address: tokenInAddress,
    decimals: results['tokenIn-decimals'],
    name: results['tokenIn-name'],
    symbol: results['tokenIn-symbol'],
    assetRateUsd: tokenInAssetRateUsd,
  };

  // 8. vault underlying asset (hard asset such as DAI or USDC) results, LP token results, etc.
  let underlyingAssetAssetRateUsd;
  if (tokenOutInAllowList && !isValidWethFlashLiquidationPair) {
    underlyingAssetAssetRateUsd = await getEthMainnetTokenMarketRateUsd(
      chainId,
      covalentApiKey,
      results['underlyingAsset-symbol'],
      underlyingAssetAddress,
    );
  }

  let underlyingAssetToken: TokenWithRate | TokenWithRateAndTotalSupply = {
    address: underlyingAssetAddress,
    decimals: results['underlyingAsset-decimals'],
    name: results['underlyingAsset-name'],
    symbol: results['underlyingAsset-symbol'],
    assetRateUsd: underlyingAssetAssetRateUsd,
  };

  let token0: TokenWithRate;
  let token1: TokenWithRate;
  let token1AssetRateUsd, token0AssetRateUsd;
  if (underlyingAssetIsLpToken(underlyingAsset)) {
    underlyingAssetToken = {
      ...underlyingAssetToken,
      totalSupply: results['underlyingAsset-totalSupply'],
    };

    const token0Address = underlyingAsset.lpTokenAddresses.token0;
    // token0 results
    token0AssetRateUsd = await getEthMainnetTokenMarketRateUsd(
      chainId,
      covalentApiKey,
      results['token0-symbol'],
      token0Address,
    );
    token0 = {
      address: token0Address,
      decimals: results['token0-decimals'],
      name: results['token0-name'],
      symbol: results['token0-symbol'],
      assetRateUsd: token0AssetRateUsd,
    };

    const token1Address = underlyingAsset.lpTokenAddresses.token1;
    // token1 results
    token1AssetRateUsd = await getEthMainnetTokenMarketRateUsd(
      chainId,
      covalentApiKey,
      results['token1-symbol'],
      token1Address,
    );
    token1 = {
      address: token1Address,
      decimals: results['token1-decimals'],
      name: results['token1-name'],
      symbol: results['token1-symbol'],
      assetRateUsd: token1AssetRateUsd,
    };
  }
  console.log('token0');
  console.log(token0);
  console.log('token1');
  console.log(token1);

  // 9. Relayer's balances
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
    token0,
    token1,
  };
};

// Checks to see if the LiquidationPair's tokenOut() is a token we are willing to swap for, avoids
// possibility of manually deployed malicious vaults/pairs
const tokenAllowListed = (config: LiquidatorConfig, tokenOut: Token) => {
  const { envTokenAllowList, chainId } = config;

  let tokenInAllowList = false;
  try {
    tokenInAllowList =
      LIQUIDATION_TOKEN_ALLOW_LIST[chainId].includes(tokenOut.address.toLowerCase()) ||
      envTokenAllowList.includes(tokenOut.address.toLowerCase());
  } catch (e) {
    console.error(chalk.red(e));
    console.error(
      chalk.white(`Perhaps chain has not been added to LIQUIDATION_TOKEN_ALLOW_LIST ?`),
    );
  }

  return tokenInAllowList;
};

// Runs .asset() on the LiquidationPair's tokenOut address as an ERC4626 Vault to test if it is one, or if it is a simple ERC20 token
// Then initializes the underlying asset as an LP Token Contract or an ERC20 Token Contract
const getUnderlyingAsset = async (
  multicallProvider: Provider,
  tokenOutAddress: string,
): Promise<{ contract: Contract; lpTokenAddresses: LpTokenAddresses }> => {
  const liquidationPairTokenOutAsVaultContract = new ethers.Contract(
    tokenOutAddress,
    ERC4626Abi,
    multicallProvider,
  );

  let contract;
  let lpTokenAddresses: LpTokenAddresses;
  try {
    const underlyingAssetAddress = await liquidationPairTokenOutAsVaultContract.asset();

    contract = new ethers.Contract(underlyingAssetAddress, LPTokenAbi, multicallProvider);

    lpTokenAddresses = await getLpTokenAddresses(multicallProvider, contract);
  } catch (e) {
    const underlyingAssetAddress = tokenOutAddress;

    contract = new ethers.Contract(underlyingAssetAddress, ERC20Abi, multicallProvider);

    console.log(
      chalk.dim(
        'liquidationPairTokenOutAsVaultContract.asset() test failed, likely an ERC20 token',
      ),
    );
    printSpacer();
  }

  return { contract, lpTokenAddresses };
};

const getLpTokenAddresses = async (
  multicallProvider: Provider,
  underlyingAssetContract: Contract,
): Promise<{ token0: string; token1: string }> => {
  let queries: Record<string, any> = {};
  queries[`token0`] = underlyingAssetContract.token0();
  queries[`token1`] = underlyingAssetContract.token1();

  // @ts-ignore
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);
  const { token0, token1 } = results;

  return { token0, token1 };
};

const underlyingAssetIsLpToken = (asset) => !!asset.lpTokenAddresses;
