import { ethers, Contract, BigNumber } from 'ethers';
import { parseUnits, formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import {
  LiquidatorConfig,
  LiquidatorContext,
  LiquidatorRelayerContext,
  LpToken,
  Token,
  TokenWithRate,
  TokenWithRateAndTotalSupply,
} from '../types.js';
import { getTokenMarketRateUsd, printSpacer } from './index.js';
import { LpTokenAbi } from '../abis/LpTokenAbi.js';
import { ERC20Abi } from '../abis/ERC20Abi.js';
import { ERC4626Abi } from '../abis/ERC4626Abi.js';
import { UniswapV2WethPairFlashLiquidatorAbi } from '../abis/UniswapV2WethPairFlashLiquidatorAbi.js';
import {
  LIQUIDATION_TOKEN_ALLOW_LIST,
  UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS,
} from '../constants/index.js';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

const tokenAddresses: string[] = [];
const tokens: Record<string, Token> = {};

/**
 * Gather information about this specific liquidation pair
 * `tokenIn` is the token to supply (likely the prize token, which is probably WETH),
 * `tokenOut` is either the Vault (vault shares, ERC4626 with .asset() as the underlying ERC20)
 * or a straight up ERC20 token (ie. DAI, USDC)
 *
 * @param liquidationRouterContract ethers contract instance for the liquidationRouter contract
 * @param liquidationPairContracts ethers contract instance array for all liquidationPair contracts
 * @param contracts blob of contracts to pull PrizePool abi/etc from
 * @returns
 */
export const getLiquidatorTokenCacheMulticall = async (
  config: LiquidatorConfig,
  liquidationRouterContract: Contract,
  liquidationPairContracts: Contract[],
  relayerAddress: string,
): Promise<Record<string, Token>> => {
  const { chainId, provider } = config;

  const multicallProvider = MulticallWrapper.wrap(provider);

  let queries: Record<string, any> = {};

  for (let i = 0; i < liquidationPairContracts.length; i++) {
    const liquidationPairContract = liquidationPairContracts[i];

    // 1. IN TOKEN
    const tokenInAddress = await liquidationPairContract.tokenIn();
    tokenAddresses.push(tokenInAddress);
    const tokenInContract = new ethers.Contract(tokenInAddress, ERC20Abi, multicallProvider);

    queries[`${tokenInAddress}-decimals`] = tokenInContract.decimals();
    queries[`${tokenInAddress}-name`] = tokenInContract.name();
    queries[`${tokenInAddress}-symbol`] = tokenInContract.symbol();

    // 2. OUT TOKEN
    const tokenOutAddress = await liquidationPairContract.tokenOut();
    tokenAddresses.push(tokenOutAddress);
    const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20Abi, multicallProvider);

    queries[`${tokenOutAddress}-decimals`] = tokenOutContract.decimals();
    queries[`${tokenOutAddress}-name`] = tokenOutContract.name();
    queries[`${tokenOutAddress}-symbol`] = tokenOutContract.symbol();

    const underlyingAssetContract: Contract = await getUnderlyingAssetContract(
      multicallProvider,
      tokenOutAddress,
    );

    const underlyingAssetAddress: string = underlyingAssetContract.address;
    tokenAddresses.push(underlyingAssetAddress);

    queries[`${underlyingAssetAddress}-decimals`] = underlyingAssetContract.decimals();
    queries[`${underlyingAssetAddress}-name`] = underlyingAssetContract.name();
    queries[`${underlyingAssetAddress}-symbol`] = underlyingAssetContract.symbol();

    // const lpToken: LpToken | undefined = await initLpToken(
    //   config,
    //   multicallProvider,
    //   underlyingAssetContract,
    // );

    // 3. RELAYER tokenIn BALANCE
    // queries[`tokenIn-balanceOf`] = tokenInContract.balanceOf(relayerAddress);
    // queries[`tokenIn-allowance`] = tokenInContract.allowance(
    //   relayerAddress,
    //   liquidationRouterContract.address,
    // );

    // // 4. Query to see if this LP pair is actually for an underlying LP asset that we can flash liquidate
    // const uniswapV2WethPairFlashLiquidatorContractAddress =
    //   UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS[chainId];

    // let isValidWethFlashLiquidationPair;
    // if (uniswapV2WethPairFlashLiquidatorContractAddress) {
    //   const uniswapV2WethPairFlashLiquidatorContract = new ethers.Contract(
    //     UNISWAP_V2_WETH_PAIR_FLASH_LIQUIDATOR_CONTRACT_ADDRESS[chainId],
    //     UniswapV2WethPairFlashLiquidatorAbi,
    //     provider,
    //   );
    //   try {
    //     isValidWethFlashLiquidationPair =
    //       await uniswapV2WethPairFlashLiquidatorContract.isValidLiquidationPair(
    //         liquidationPairContract.address,
    //       );
    //   } catch (e) {}
    // }
  }
  console.log('queries');
  console.log(queries);

  // 5. Get and process results!
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  for (let i = 0; i < tokenAddresses.length; i++) {
    const tokenAddress = tokenAddresses[i];

    const token: Token = {
      address: tokenAddress,
      decimals: results[`${tokenAddress}-decimals`],
      name: results[`${tokenAddress}-name`],
      symbol: results[`${tokenAddress}-symbol`],
    };

    tokens[tokenAddress] = token;
  }

  return tokens;
};

// Checks to see if the LiquidationPair's tokenOut() is a token we are willing to swap for, avoids
// possibility of manually deployed malicious vaults/pairs
const tokenAllowListed = (config: LiquidatorConfig, tokenAddress: string): boolean => {
  const { envTokenAllowList, chainId } = config;

  let inAllowList = false;
  try {
    inAllowList =
      LIQUIDATION_TOKEN_ALLOW_LIST[chainId].includes(tokenAddress.toLowerCase()) ||
      envTokenAllowList.includes(tokenAddress.toLowerCase());
  } catch (e) {
    console.error(chalk.red(e));
    console.error(
      chalk.white(`Perhaps chain has not been added to LIQUIDATION_TOKEN_ALLOW_LIST ?`),
    );
  }

  if (!inAllowList) {
    console.log(chalk.yellow(`token (CA: ${tokenAddress.toLowerCase()}) not in token allow list`));
  }

  return inAllowList;
};

// Runs .asset() on the LiquidationPair's tokenOut address as an ERC4626 Vault
// to test if it is one, or if it is a simple ERC20 token
//
// Then initializes the underlying asset as an LP Token Contract or an ERC20 Token Contract
const getUnderlyingAssetContract = async (
  multicallProvider: Provider,
  tokenOutAddress: string,
): Promise<Contract> => {
  const liquidationPairTokenOutAsVaultContract = new ethers.Contract(
    tokenOutAddress,
    ERC4626Abi,
    multicallProvider,
  );

  let underlyingAssetAddress, contract;
  try {
    underlyingAssetAddress = await liquidationPairTokenOutAsVaultContract.asset();
    console.log(chalk.dim('tokenOut as ERC4626 vault (.asset()) test succeeded'));
  } catch (e) {
    underlyingAssetAddress = tokenOutAddress;

    console.log(chalk.dim('tokenOut as ERC4626 (.asset()) test failed'));
    printSpacer();
  }

  // LP token test for underlyingAsset
  try {
    contract = new ethers.Contract(underlyingAssetAddress, LpTokenAbi, multicallProvider);
    await contract.token0();
    console.log(chalk.dim('underlyingAsset as LP Token (.token0()) test succeeded'));
  } catch (e) {
    contract = new ethers.Contract(underlyingAssetAddress, ERC20Abi, multicallProvider);

    console.log(
      chalk.dim(
        'underlyingAsset as LP token (.token0()) test failed, initializing as an ERC20 token',
      ),
    );
  }

  printSpacer();

  return contract;
};

const getLpTokenAddresses = async (
  multicallProvider: Provider,
  lpTokenContract: Contract,
): Promise<{ token0Address: string; token1Address: string }> => {
  let queries: Record<string, any> = {};
  queries[`token0Address`] = lpTokenContract.token0();
  queries[`token1Address`] = lpTokenContract.token1();

  // @ts-ignore
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);
  const { token0Address, token1Address } = results;

  return { token0Address, token1Address };
};

const underlyingAssetIsLpToken = (underlyingAssetContract: Contract): boolean =>
  !!underlyingAssetContract.token0;

const getLpTokenReserves = async (lpToken: LpToken): Promise<[BigNumber, BigNumber]> => {
  try {
    const totalReserves = await lpToken.contract.getReserves();
    return [totalReserves[0], totalReserves[1]];
  } catch (e) {
    console.log(e);
    return [BigNumber.from(0), BigNumber.from(0)];
  }
};

const initLpToken = async (
  config: LiquidatorConfig,
  multicallProvider: Provider,
  lpTokenContract: Contract,
): Promise<LpToken | undefined> => {
  let queries: Record<string, any> = {};

  if (underlyingAssetIsLpToken(lpTokenContract)) {
    const lpToken: LpToken = {
      contract: lpTokenContract,
      lpTokenAddresses: await getLpTokenAddresses(multicallProvider, lpTokenContract),
      totalSupply: undefined,
      reserves: undefined,
      token0: undefined,
      token1: undefined,
      assetRateUsd: undefined,
    };

    queries[`totalSupply`] = lpTokenContract.totalSupply();

    const token0Contract = new ethers.Contract(
      lpToken.lpTokenAddresses.token0Address,
      ERC20Abi,
      multicallProvider,
    );
    queries[`token0-decimals`] = token0Contract.decimals();
    queries[`token0-name`] = token0Contract.name();
    queries[`token0-symbol`] = token0Contract.symbol();

    const token1Contract = new ethers.Contract(
      lpToken.lpTokenAddresses.token1Address,
      ERC20Abi,
      multicallProvider,
    );
    queries[`token1-decimals`] = token1Contract.decimals();
    queries[`token1-name`] = token1Contract.name();
    queries[`token1-symbol`] = token1Contract.symbol();

    // @ts-ignore
    const results = await getEthersMulticallProviderResults(multicallProvider, queries);

    const { token0Address, token1Address } = lpToken.lpTokenAddresses;

    lpToken.totalSupply = results['totalSupply'];

    // token0 results
    let token0AssetRateUsd;
    const token0InAllowList = tokenAllowListed(config, token0Address);
    if (token0InAllowList) {
      token0AssetRateUsd = await getTokenMarketRateUsd(token0Address, config);
    }
    lpToken.token0 = {
      address: token0Address,
      decimals: results['token0-decimals'],
      name: results['token0-name'],
      symbol: results['token0-symbol'],
      assetRateUsd: token0AssetRateUsd,
    };

    // token1 results
    let token1AssetRateUsd;
    const token1InAllowList = tokenAllowListed(config, token1Address);
    if (token1InAllowList) {
      token1AssetRateUsd = await getTokenMarketRateUsd(token1Address, config);
    }
    lpToken.token1 = {
      address: token1Address,
      decimals: results['token1-decimals'],
      name: results['token1-name'],
      symbol: results['token1-symbol'],
      assetRateUsd: token1AssetRateUsd,
    };

    lpToken.reserves = await getLpTokenReserves(lpToken);

    lpToken.assetRateUsd = Number(calculateLpTokenPrice(lpToken));

    return lpToken;
  }
};

// TODO: This will likely only work for lpTokens where token0 and token1's decimals are
// equal (ie. 6 and 6, 18 and 18). Otherwise the reserve amounts will need to be normalized
// to the same precision
const EXPONENT = 18;
const calculateLpTokenPrice = (lpToken): number => {
  // If we don't have a price for token0 and for token1 we can't calculate LP token price
  if (!lpToken.token0.assetRateUsd || !lpToken.token1.assetRateUsd) {
    return 0;
  }

  // Convert USD prices from floats into BigNumber's using EXPONENT
  const price0 = parseUnits(lpToken.token0.assetRateUsd.toString(), EXPONENT);
  const price1 = parseUnits(lpToken.token1.assetRateUsd.toString(), EXPONENT);

  const tokenPriceCumulative = sqrt(price0.mul(price1));
  const tokenReserveCumulative = sqrt(lpToken.reserves[0].mul(lpToken.reserves[1]));

  const totalSupply = lpToken.totalSupply;
  const lpTokenPriceBN = tokenReserveCumulative.mul(tokenPriceCumulative).mul(2).div(totalSupply);

  // Convert from BigNumber back to float / decimal
  return Number(formatUnits(lpTokenPriceBN, EXPONENT));
};

const ONE = ethers.BigNumber.from(1);
const TWO = ethers.BigNumber.from(2);

function sqrt(value) {
  const x = ethers.BigNumber.from(value);
  let z = x.add(ONE).div(TWO);
  let y = x;
  while (z.sub(y).isNegative()) {
    y = z;
    z = x.div(z).add(z).div(TWO);
  }
  return y;
}
