import { ethers, Contract, BigNumber } from 'ethers';
import { parseUnits, formatUnits } from '@ethersproject/units';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import { normalizeBigNumber } from './index.js';
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
import { getEthMainnetTokenMarketRateUsd, printSpacer } from '../utils/index.js';
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
  covalentApiKey?: string,
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

  const underlyingAssetContract: Contract = await getUnderlyingAssetContract(
    multicallProvider,
    tokenOutAddress,
  );

  const underlyingAssetAddress: string = underlyingAssetContract.address;

  queries[`underlyingAsset-decimals`] = underlyingAssetContract.decimals();
  queries[`underlyingAsset-name`] = underlyingAssetContract.name();
  queries[`underlyingAsset-symbol`] = underlyingAssetContract.symbol();

  const lpToken: LpToken | undefined = await initLpToken(
    config,
    chainId,
    multicallProvider,
    underlyingAssetContract,
    covalentApiKey,
  );

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

  const tokenOutInAllowList = tokenAllowListed(config, tokenOut.address);

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

  // 8. vault underlying asset (hard asset such as DAI or USDC) results, LP token results, etc.
  let underlyingAssetAssetRateUsd;
  if (tokenOutInAllowList && !isValidWethFlashLiquidationPair) {
    if (lpToken?.assetRateUsd) {
      underlyingAssetAssetRateUsd = lpToken.assetRateUsd;
    } else {
      underlyingAssetAssetRateUsd = await getEthMainnetTokenMarketRateUsd(
        chainId,
        results['underlyingAsset-symbol'],
        underlyingAssetAddress,
        covalentApiKey,
      );
    }
  }

  let underlyingAssetToken: TokenWithRate | TokenWithRateAndTotalSupply = {
    address: underlyingAssetAddress,
    decimals: results['underlyingAsset-decimals'],
    name: results['underlyingAsset-name'],
    symbol: results['underlyingAsset-symbol'],
    assetRateUsd: underlyingAssetAssetRateUsd,
  };

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
    lpToken,
  };
};

// Checks to see if the LiquidationPair's tokenOut() is a token we are willing to swap for, avoids
// possibility of manually deployed malicious vaults/pairs
const tokenAllowListed = (config: LiquidatorConfig, tokenAddress: string): boolean => {
  const { envTokenAllowList, chainId } = config;

  let inAllowList = false;
  try {
    inAllowList =
      LIQUIDATION_TOKEN_ALLOW_LIST[chainId].includes(tokenAddress.toLowerCase()) ||
      envTokenAllowList?.includes(tokenAddress.toLowerCase());
  } catch (e) {
    console.error(chalk.red(e));
    console.error(
      chalk.white(`Perhaps chain has not been added to LIQUIDATION_TOKEN_ALLOW_LIST ?`),
    );
  }

  if (!inAllowList) {
    console.log(
      chalk.yellowBright(`token (CA: ${tokenAddress.toLowerCase()}) not in token allow list`),
    );
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
  chainId: number,
  multicallProvider: Provider,
  lpTokenContract: Contract,
  covalentApiKey?: string,
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
      token0AssetRateUsd = await getEthMainnetTokenMarketRateUsd(
        chainId,
        results['token0-symbol'],
        token0Address,
        covalentApiKey,
      );
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
      token1AssetRateUsd = await getEthMainnetTokenMarketRateUsd(
        chainId,
        results['token1-symbol'],
        token1Address,
        covalentApiKey,
      );
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

const MAX_DECIMALS = 18;
const calculateLpTokenPrice = (lpToken): number => {
  // If we don't have a price for token0 and for token1 we can't calculate LP token price
  if (!lpToken.token0.assetRateUsd || !lpToken.token1.assetRateUsd) {
    return 0;
  }

  // Convert USD prices from floats into BigNumber's using MAX_DECIMALS
  const price0 = parseUnits(lpToken.token0.assetRateUsd.toString(), MAX_DECIMALS);
  const price1 = parseUnits(lpToken.token1.assetRateUsd.toString(), MAX_DECIMALS);
  const tokenPriceCumulative = sqrt(price0.mul(price1));

  const lpToken0Reserves = normalizeBigNumber(
    lpToken.reserves[0],
    lpToken.token0.decimals,
    MAX_DECIMALS,
  );
  const lpToken1Reserves = normalizeBigNumber(
    lpToken.reserves[1],
    lpToken.token1.decimals,
    MAX_DECIMALS,
  );

  const tokenReserveCumulative = sqrt(lpToken0Reserves.mul(lpToken1Reserves));

  const totalSupply = lpToken.totalSupply;
  const lpTokenPriceBN = tokenReserveCumulative.mul(tokenPriceCumulative).mul(2).div(totalSupply);

  // Convert from BigNumber back to float / decimal
  return Number(formatUnits(lpTokenPriceBN, MAX_DECIMALS));
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
