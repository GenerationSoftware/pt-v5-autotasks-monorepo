import chalk from 'chalk';
import { ethers, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import debug from 'debug';

import { GasPriceOracleAbi } from '../abis/GasPriceOracleAbi.js';
import { isTestnet, CHAIN_IDS, NETWORK_NATIVE_TOKEN_INFO } from '../constants/network.js';
import { ADDRESS_TO_COVALENT_LOOKUP, CHAIN_GAS_PRICE_MULTIPLIERS } from '../constants/index.js';
import type { AutotaskConfig } from '../types';
import {
  CHAIN_IDS_TO_COVALENT_LOOKUP,
  // SYMBOL_TO_COINGECKO_LOOKUP,
  CHAIN_ID_TO_COINGECKO_LOOKUP,
  NETWORK_NATIVE_TOKEN_ADDRESS_TO_ERC20_LOOKUP,
} from '../constants/usd.js';
import { printSpacer } from './logging.js';

const debugPriceCache = debug('priceCache');

const GAS_PRICE_ORACLE_ADDRESS = '0x420000000000000000000000000000000000000F';
const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest';
const COVALENT_API_URL = 'https://api.covalenthq.com/v1';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const DEXSCREENER_SUPPORTED_CHAIN_NAME_ALLOWLIST = [
  'ethereum',
  'arbitrum',
  'optimism',
  'base',
  'scroll',
  'gnosischain',
];

const DEXSCREENER_SUPPORTED_DEX_NAME_ALLOWLIST = [
  'uniswap',
  'aerodrome',
  'pancakeswap',
  'sushiswap',
  'balancer',
  'velodrome',
  'traderjoe',
  'camelot',
  'kyberswap',
];

const marketRates = {};

/**
 * Get the estimated USD cost of a transaction based on native token market rate and estimated gas limit
 *
 * @param {BigNumber} estimatedGasLimit, how much gas the function is estimated to use (in wei)
 * @param {gasTokenMarketRateUsd} context, provided from MarketRate contract or from an API
 * @param {Provider} provider, any ethers provider
 * @returns {Promise} Promise object with recent avgFeeUsd
 *
 **/
export const getFeesUsd = async (
  chainId: number,
  estimatedGasLimit: BigNumber,
  gasTokenMarketRateUsd: number,
  provider: Provider,
  txData?: any,
): Promise<{ avgFeeUsd: number }> => {
  const fees = { avgFeeUsd: null };

  const gasPrice = await provider.getGasPrice();

  if (!gasPrice || !estimatedGasLimit || estimatedGasLimit.eq(0)) {
    return fees;
  }

  const baseFeeWei = gasPrice.mul(estimatedGasLimit);
  const l1GasFeeWei = await getL1GasFee(chainId, provider, txData);

  let chainGasPriceMultiplier = 1;
  if (CHAIN_GAS_PRICE_MULTIPLIERS[chainId]) {
    chainGasPriceMultiplier = CHAIN_GAS_PRICE_MULTIPLIERS[chainId];
  }

  const avgFeeUsd =
    parseFloat(ethers.utils.formatEther(baseFeeWei.add(l1GasFeeWei))) *
    gasTokenMarketRateUsd *
    chainGasPriceMultiplier;

  return { avgFeeUsd };
};

/**
 * Gets the current USD value of Native Gas Token for Current Chain
 *
 * @returns {number} The spot price for the Native Gas Token in USD
 **/
export const getNativeTokenMarketRateUsd = async (config: AutotaskConfig): Promise<number> => {
  const tokenSymbol = NETWORK_NATIVE_TOKEN_INFO[config.chainId].symbol;
  const tokenAddress =
    tokenSymbol === 'ETH' ? NETWORK_NATIVE_TOKEN_ADDRESS_TO_ERC20_LOOKUP[config.chainId] : '';

  const lowercaseTokenAddress = tokenAddress.toLowerCase();
  return await getTokenMarketRateUsd(lowercaseTokenAddress, config);
};

export const getTokenMarketRateUsd = async (
  tokenAddress: string,
  config: AutotaskConfig,
): Promise<number> => {
  const lowercaseTokenAddress = tokenAddress.toLowerCase();
  const rates = await getTokenMarketRatesUsd([lowercaseTokenAddress], config);

  return rates[lowercaseTokenAddress];
};

/**
 * Finds the spot price of a token in USD
 * @returns {number} tokenRateUsd
 */
export const getTokenMarketRatesUsd = async (
  tokenAddresses: string[],
  { chainId, coingeckoApiKey, covalentApiKey }: AutotaskConfig,
): Promise<number> => {
  debugPriceCache('');
  // debugPriceCache(marketRates);

  // memoization
  const tokenAddressesKey = tokenAddresses
    .map((tokenAddress) => tokenAddress.toLowerCase())
    .join('-');

  const key = `price-cache-${tokenAddressesKey}`;
  console.log('key');
  console.log(key);
  if (marketRates[key]) {
    debugPriceCache(chalk.red('cache hit!', key, `= $${marketRates[key]}`));
    return marketRates[key];
  }

  let marketRateUsd;
  // 1. DexScreener
  // Note: Currently only supports Free API
  // let marketRateUsd;
  // try {
  //   marketRateUsd = await getDexscreenerMarketRateUsd(tokenAddress);
  //   if (!!marketRateUsd) {
  //     debugPriceCache(chalk.red(tokenAddress, 'found via DexScreener API'));
  //   }
  // } catch (err) {
  //   // console.log(err);
  // }

  // 2. Covalent
  // Note: Needs API key
  // try {
  //   if (!marketRateUsd && Boolean(covalentApiKey)) {
  //     if (Boolean(tokenAddress)) {
  //       marketRateUsd = await getCovalentMarketRateUsd(chainId, tokenAddress, covalentApiKey);
  //       if (!!marketRateUsd) {
  //         debugPriceCache(chalk.red(tokenAddress, 'found via Covalent API'));
  //       }
  //     } else {
  //       console.log(
  //         chalk.yellow(
  //           `Token with symbol ${symbol} address not found for Covalent API price lookup.`,
  //         ),
  //       );
  //     }
  //   }
  // } catch (err) {
  //   // console.log(err);
  // }

  // 3. Coingecko
  // Note: Needs API key, demo API key is fine
  try {
    if (!marketRateUsd && Boolean(coingeckoApiKey)) {
      marketRateUsd = await getCoingeckoMarketRatesUsd(chainId, tokenAddresses, coingeckoApiKey);
      if (!!marketRateUsd) {
        debugPriceCache(chalk.red(tokenAddresses, 'found via Coingecko API'));
      }
    }
  } catch (err) {
    // console.log(err);
  }

  marketRates[key] = marketRateUsd;
  debugPriceCache(chalk.red(`cache miss - storing USd prices for token addresses:`, key));

  return marketRateUsd;
};

export const getDexscreenerMarketRateUsd = async (tokenAddress: string): Promise<number> => {
  let marketRate;

  try {
    const url = new URL(`${DEXSCREENER_API_URL}/dex/tokens/${tokenAddress}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.log(
        chalk.yellow(
          `Unable to fetch current USD value from Dexscreener of '${tokenAddress}' token.`,
        ),
      );
      throw new Error(response.statusText);
    }
    const json = await response.json();
    let pairs = json.pairs;

    // Filter out results that do not match the chains we're interested in as they can easily throw off the average
    pairs = pairs.filter((pair) =>
      DEXSCREENER_SUPPORTED_CHAIN_NAME_ALLOWLIST.includes(pair.chainId),
    );

    // Filter out results from DEXes we don't know about and may not be legit
    pairs = pairs.filter((pair) => DEXSCREENER_SUPPORTED_DEX_NAME_ALLOWLIST.includes(pair.dexId));

    // Filter out results where baseToken is not the token we want the price for (ie. if we want DAI, baseToken must be DAI)
    pairs = pairs.filter(
      (pair) => pair.baseToken.address.toLowerCase() === tokenAddress.toLowerCase(),
    );

    let pairsUsd = pairs.map((pair) => Number(pair.priceUsd));
    pairsUsd = filterOutliers(pairsUsd);

    marketRate = getAverage(pairsUsd);
  } catch (err) {
    console.log(err);
  }

  return marketRate;
};

export const getCoingeckoMarketRatesUsd = async (
  chainId: number,
  tokenAddresses: string[],
  coingeckoApiKey?: string,
): Promise<Record<string, number>> => {
  // const coingeckoTokenApiId = SYMBOL_TO_COINGECKO_LOOKUP[symbol];
  // if (!coingeckoTokenApiId) {
  //   printSpacer();
  //   console.log(chalk.yellow(`Note: No Coingecko token API ID found for symbol: '${symbol}'`));
  //   printSpacer();
  //   return;
  // }

  const coingeckoChainName = CHAIN_ID_TO_COINGECKO_LOOKUP[chainId];

  let marketRates = {};
  try {
    const url = new URL(`${COINGECKO_API_URL}/simple/token_price/${coingeckoChainName}`);
    url.searchParams.set('contract_addresses', tokenAddresses.join(','));
    url.searchParams.set('vs_currencies', 'usd');

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-cg-demo-api-key': coingeckoApiKey,
      },
    });
    if (!response.ok) {
      console.log(chalk.yellow(`Unable to fetch current USD values from Coingecko for:`));
      tokenAddresses.map((tokenAddress) => console.log(tokenAddress));

      throw new Error(response.statusText);
    }
    const marketRatesJson: Record<string, Record<string, number>> = await response.json();
    for (let marketRateJson of Object.entries(marketRatesJson)) {
      const tokenAddress = marketRateJson[0];
      const result = marketRateJson[1];
      marketRates[tokenAddress] = result.usd;
    }
  } catch (err) {
    console.log(err);
  }

  return marketRates;
};

export const getCovalentMarketRateUsd = async (
  chainId: number,
  tokenAddress: string,
  covalentApiKey: string,
): Promise<number> => {
  let address, covalentChainName;

  if (isTestnet(chainId)) {
    const lookupAddress = ADDRESS_TO_COVALENT_LOOKUP[tokenAddress.toLowerCase()];
    address = lookupAddress ? lookupAddress : tokenAddress.toLowerCase();
    covalentChainName = CHAIN_IDS_TO_COVALENT_LOOKUP[CHAIN_IDS.mainnet];
  } else {
    address = tokenAddress.toLowerCase();

    covalentChainName = CHAIN_IDS_TO_COVALENT_LOOKUP[chainId];
  }

  let rateUsd;
  if (address) {
    try {
      const url = new URL(
        `${COVALENT_API_URL}/pricing/historical_by_addresses_v2/${covalentChainName}/usd/${address}/`,
      );
      url.searchParams.set('key', covalentApiKey);
      url.searchParams.set('from', getDateXDaysAgo(3));
      const response = await fetch(url.toString());

      if (!response.ok) {
        console.log(
          chalk.yellow(
            `Error while fetching USD value from Covalent of token with CA: '${address}'.`,
          ),
        );
        throw new Error(response.statusText);
      }

      const tokenPricesArray = (await response.json()).data;

      const tokenPrices = {};
      tokenPricesArray.forEach((token) => {
        let tokenPrice: number | null = null;
        token.prices.forEach((day) => {
          if (tokenPrice === null) {
            tokenPrice = day.price;
          }
        });
        if (tokenPrice !== null) {
          tokenPrices[token.contract_address.toLowerCase() as `0x${string}`] = tokenPrice;
        }
      });

      rateUsd = tokenPrices[address.toLowerCase()];
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log(
      chalk.yellow(
        `Unable to fetch current USD value from Covalent of token: '${tokenAddress}', missing lookup contract address on ETH mainnet.`,
      ),
    );
  }

  return rateUsd;
};

const getDateXDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// If we are dealing with an L2 also get the L1 data fee that needs to be paid
const getL1GasFee = async (
  chainId: number,
  provider: Provider,
  txData: any,
): Promise<BigNumber> => {
  if ([CHAIN_IDS.optimism, CHAIN_IDS.optimismSepolia].includes(chainId)) {
    if (!txData) {
      console.error(chalk.red('txData not provided to `getL1GasFee`, required on Optimism'));
    }

    const gasPriceOracleContract = new ethers.Contract(
      GAS_PRICE_ORACLE_ADDRESS,
      GasPriceOracleAbi,
      provider,
    );

    return await gasPriceOracleContract.getL1Fee(txData);
  } else {
    return BigNumber.from(0);
  }
};

// Sums up all numbers in an array then divides by the length of the array to get the average
const getAverage = (array) =>
  array.reduce((sum, currentValue) => sum + currentValue, 0) / array.length;

// Removes numbers from an array that are considered outliers.
// ie. [121, 122, 120, 4, 9660, 120, 122, 121]
// would remove 4 and 9660, [121, 122, 120, 120, 122, 121] would remain
//
// https://stackoverflow.com/questions/20811131/javascript-remove-outlier-from-an-array
const filterOutliers = (array) => {
  if (array.length < 4) {
    return array;
  }

  let values = array.slice().sort((a, b) => a - b); // copy array fast and sort

  let q1 = getQuantile(values, 25);
  let q3 = getQuantile(values, 75);

  let iqr, maxValue, minValue;
  iqr = q3 - q1;
  maxValue = q3 + iqr * 1.5;
  minValue = q1 - iqr * 1.5;

  return values.filter((x) => x >= minValue && x <= maxValue);
};

const getQuantile = (array, quantile) => {
  // Get the index the quantile is at.
  let index = (quantile / 100.0) * (array.length - 1);

  // Check if it has decimal places.
  if (index % 1 === 0) {
    return array[index];
  } else {
    // Get the lower index.
    let lowerIndex = Math.floor(index);
    // Get the remaining.
    let remainder = index - lowerIndex;
    // Add the remaining to the lowerindex value.
    return array[lowerIndex] + remainder * (array[lowerIndex + 1] - array[lowerIndex]);
  }
};
