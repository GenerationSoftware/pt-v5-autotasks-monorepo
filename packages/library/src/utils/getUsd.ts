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

const GAS_PRICE_ORACLE_ADDRESS = '0x420000000000000000000000000000000000000F';
const COVALENT_API_URL = 'https://api.covalenthq.com/v1';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const marketRates = {};

/**
 * Get the current feeData from chain (currently unused as it was less accurate than getGasPrice)
 *
 * @param {Provider} provider, any ethers provider
 * @returns {Promise} Promise object with recent baseFeeUsd & maxFeeUsd from the chain
 *                    while avgFeeUsd is in between the two
 **/
export const getFees = async (
  provider: Provider,
): Promise<{
  lastBaseFeePerGas?: BigNumber;
  maxFeePerGas?: BigNumber;
  avgFeePerGas?: BigNumber;
}> => {
  const feeData = await provider.getFeeData();

  const lastBaseFeePerGas = feeData.lastBaseFeePerGas;
  const maxFeePerGas = feeData.maxFeePerGas;

  const avgFeePerGas = lastBaseFeePerGas.add(maxFeePerGas).div(2);

  return { lastBaseFeePerGas, maxFeePerGas, avgFeePerGas };
};

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
  covalentApiKey: string,
): Promise<number> => {
  const tokenSymbol = NETWORK_NATIVE_TOKEN_INFO[chainId].symbol;
  const tokenAddress =
    tokenSymbol === 'ETH' ? NETWORK_NATIVE_TOKEN_ADDRESS_TO_ERC20_LOOKUP[chainId] : '';

  return await getEthMainnetTokenMarketRateUsd(chainId, covalentApiKey, tokenSymbol, tokenAddress);
};

/**
 * Finds the spot price of a token in USD (from ETH Mainnet only)
 * @returns {number} tokenRateUsd
 */
export const getEthMainnetTokenMarketRateUsd = async (
  chainId: number,
  covalentApiKey: string,
  symbol: string,
  tokenAddress?: string,
): Promise<number> => {
  // memoization
  if (marketRates[symbol]) {
    return marketRates[symbol];
  }

  let marketRateUsd;
  try {
    if (Boolean(covalentApiKey)) {
      if (Boolean(tokenAddress)) {
        marketRateUsd = await getCovalentMarketRateUsd(chainId, tokenAddress, covalentApiKey);
      } else {
        console.log(
          chalk.yellow(
            `Token with symbol ${symbol} address not found for Covalent API price lookup.`,
          ),
        );
      }
    }
  } catch (err) {
    console.log(err);
  }

  try {
    if (!marketRateUsd) {
      marketRateUsd = await getCoingeckoMarketRateUsd(symbol);
    }
  } catch (err) {
    console.log(err);
  }

  marketRates[symbol] = marketRateUsd;

  return marketRateUsd;
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
