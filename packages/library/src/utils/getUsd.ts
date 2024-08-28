import chalk from 'chalk';
import { ethers, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { GasPriceOracleAbi } from '../abis/GasPriceOracleAbi.js';
import { isTestnet, CHAIN_IDS, NETWORK_NATIVE_TOKEN_INFO } from '../constants/network.js';
import { ADDRESS_TO_COVALENT_LOOKUP, CHAIN_GAS_PRICE_MULTIPLIERS } from '../constants/index.js';
import {
  CHAIN_IDS_TO_COVALENT_LOOKUP,
  SYMBOL_TO_COINGECKO_LOOKUP,
  NETWORK_NATIVE_TOKEN_ADDRESS_TO_ERC20_LOOKUP,
} from '../constants/usd.js';
import { printSpacer } from './logging.js';
import debug from 'debug';

const debugPriceCache = debug('priceCache');

const GAS_PRICE_ORACLE_ADDRESS = '0x420000000000000000000000000000000000000F';
const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex/tokens';
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
export const getNativeTokenMarketRateUsd = async (
  chainId: number,
  covalentApiKey?: string,
): Promise<number> => {
  const tokenSymbol = NETWORK_NATIVE_TOKEN_INFO[chainId].symbol;
  const tokenAddress =
    tokenSymbol === 'ETH' ? NETWORK_NATIVE_TOKEN_ADDRESS_TO_ERC20_LOOKUP[chainId] : '';

  return await getEthMainnetTokenMarketRateUsd(chainId, tokenSymbol, tokenAddress, covalentApiKey);
};

/**
 * Finds the spot price of a token in USD (from ETH Mainnet only)
 * @returns {number} tokenRateUsd
 */
export const getEthMainnetTokenMarketRateUsd = async (
  chainId: number,
  symbol: string,
  tokenAddress: string,
  covalentApiKey?: string,
): Promise<number> => {
  // memoization
  // debugPriceCache(marketRates);
  debugPriceCache('');
  if (marketRates[tokenAddress.toLowerCase()]) {
    debugPriceCache(
      chalk.red('cache hit!', tokenAddress, `= $${marketRates[tokenAddress.toLowerCase()]}`),
    );
    return marketRates[tokenAddress.toLowerCase()];
  }

  // 1. DexScreener
  // Note: Currently only supports Free API
  let marketRateUsd;
  try {
    marketRateUsd = await getDexscreenerMarketRateUsd(tokenAddress);
    if (!!marketRateUsd) {
      debugPriceCache(chalk.red(tokenAddress, 'found via DexScreener API'));
    }
  } catch (err) {
    // console.log(err);
  }

  // 2. Covalent
  // Note: Needs API key
  try {
    if (!marketRateUsd) {
      if (Boolean(covalentApiKey)) {
        if (Boolean(tokenAddress)) {
          marketRateUsd = await getCovalentMarketRateUsd(chainId, tokenAddress, covalentApiKey);
          if (!!marketRateUsd) {
            debugPriceCache(chalk.red(tokenAddress, 'found via Covalent API'));
          }
        } else {
          console.log(
            chalk.yellow(
              `Token with symbol ${symbol} address not found for Covalent API price lookup.`,
            ),
          );
        }
      }
    }
  } catch (err) {
    // console.log(err);
  }

  // 3. Coingecko
  // Note: Currently only supports rate-limited Free API
  try {
    if (!marketRateUsd) {
      marketRateUsd = await getCoingeckoMarketRateUsd(symbol);
      if (!!marketRateUsd) {
        debugPriceCache(chalk.red(tokenAddress, 'found via Coingecko API'));
      }
    }
  } catch (err) {
    // console.log(err);
  }

  marketRates[tokenAddress.toLowerCase()] = marketRateUsd;
  debugPriceCache(
    chalk.red(`cache miss - storing ${marketRateUsd} for`, tokenAddress.toLowerCase()),
  );

  return marketRateUsd;
};

export const getDexscreenerMarketRateUsd = async (tokenAddress: string): Promise<number> => {
  let marketRate;

  try {
    const uri = `${DEXSCREENER_API_URL}/${tokenAddress}`;
    const response = await fetch(uri);
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

    const pairsUsd = pairs.map((pair) => Number(pair.priceUsd));
    marketRate = getAverage(pairsUsd);
  } catch (err) {
    console.log(err);
  }

  return marketRate;
};

export const getCoingeckoMarketRateUsd = async (symbol: string): Promise<number> => {
  let marketRate;

  const coingeckoTokenApiId = SYMBOL_TO_COINGECKO_LOOKUP[symbol];
  if (!coingeckoTokenApiId) {
    printSpacer();
    console.log(chalk.yellow(`Note: No Coingecko token API ID found for symbol: '${symbol}'`));
    printSpacer();
    return;
  }

  try {
    const uri = `${COINGECKO_API_URL}/simple/price?ids=${coingeckoTokenApiId}&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`;
    const response = await fetch(uri);
    if (!response.ok) {
      console.log(
        chalk.yellow(`Unable to fetch current USD value from Coingecko of '${symbol}' token.`),
      );
      throw new Error(response.statusText);
    }
    marketRate = await response.json();
    marketRate = marketRate[coingeckoTokenApiId]?.usd;
  } catch (err) {
    console.log(err);
  }

  return marketRate;
};

export const getCovalentMarketRateUsd = async (
  chainId: number,
  tokenAddress: string,
  covalentApiKey?: string,
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

const getAverage = (array) =>
  array.reduce((sum, currentValue) => sum + currentValue, 0) / array.length;
