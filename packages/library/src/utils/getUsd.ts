import { ethers, BigNumber, Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import chalk from 'chalk';

import { TESTNET_NETWORK_NATIVE_TOKEN_ADDRESS } from './network';
import { Token } from '../types';
import { parseBigNumberAsFloat } from '../utils';

export const MARKET_RATE_CONTRACT_DECIMALS = 8;

const SYMBOL_TO_COINGECKO_LOOKUP = {
  POOL: 'pooltogether',
  LINK: 'link',
};

const ADDRESS_TO_COVALENT_LOOKUP = {
  '0x09f06F4BC026fB75E0064747edd49D371D20D434': '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e', // POOL Sepolia -> ETH
  '0x779877a7b0d9e8603169ddbd7836e478b4624789': '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK Sepolia -> ETH
};

const CHAIN_GAS_PRICE_MULTIPLIERS = {
  1: 1,
  11155111: 0.01, // if we want Sepolia to act more like Optimism/etc, set this to a fraction such as 0.1
  80001: 24, // mumbai seems to return a much cheaper gas price then it bills you for
};

const COVALENT_API_URL = 'https://api.covalenthq.com/v1';

/**
 * Gather info on current fees from the chain
 *
 * @param {BigNumber} estimatedGasLimit, how much gas the function is estimated to use (in wei)
 * @param {gasTokenMarketRateUsd} context, provided from MarketRate contract or from an API
 * @param {Provider} provider, any ethers provider
 * @returns {Promise} Promise object with recent baseFeeUsd & maxFeeUsd from the chain
 *                    while avgFeeUsd is in between the two
 **/
export const getFeesUsd = async (
  chainId: number,
  estimatedGasLimit: BigNumber,
  gasTokenMarketRateUsd: number,
  provider: Provider,
): Promise<{ baseFeeUsd: number; maxFeeUsd: number; avgFeeUsd: number }> => {
  const fees = { baseFeeUsd: null, maxFeeUsd: null, avgFeeUsd: null };

  const feeData = await provider.getFeeData();

  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    return fees;
  }

  const baseFeeWei = feeData.lastBaseFeePerGas?.mul(estimatedGasLimit);
  const maxFeeWei = feeData.maxFeePerGas?.mul(estimatedGasLimit);

  const chainMultiplier = CHAIN_GAS_PRICE_MULTIPLIERS[chainId];

  fees.baseFeeUsd =
    parseFloat(ethers.utils.formatEther(baseFeeWei)) * gasTokenMarketRateUsd * chainMultiplier;
  fees.maxFeeUsd =
    parseFloat(ethers.utils.formatEther(maxFeeWei)) * gasTokenMarketRateUsd * chainMultiplier;
  fees.avgFeeUsd = ((fees.baseFeeUsd + fees.maxFeeUsd) / 2) * chainMultiplier;

  return fees;
};

/**
 * TESTNET: Gets the current USD value of Native Gas Token for Current Chain
 * On testnet: Search testnet contract blob to get wETH contract then ask MarketRate contract
 * TODO: 0x spot API/DEX subgraphs/other sources for production rates
 *
 * @returns {number} The spot price for the Native Gas Token in USD
 **/
export const getGasTokenMarketRateUsd = async (marketRate: Contract) => {
  const nativeTokenAddress = TESTNET_NETWORK_NATIVE_TOKEN_ADDRESS;
  const gasTokenRate = await marketRate.priceFeed(nativeTokenAddress, 'USD');

  return parseFloat(ethers.utils.formatUnits(gasTokenRate, MARKET_RATE_CONTRACT_DECIMALS));
};

/**
 * TESTNET: Finds the spot price of a token in USD
 * @returns {number} tokenRateUsd
 */
export const getTokenRateUsd = async (marketRate: Contract, token: Token): Promise<number> => {
  const tokenAddress = token.address;
  const tokenRate = await marketRate.priceFeed(tokenAddress, 'USD');

  return parseBigNumberAsFloat(tokenRate, MARKET_RATE_CONTRACT_DECIMALS);
};

/**
 * Finds the spot price of a token in USD (from ETH Mainnet only)
 * @returns {number} tokenRateUsd
 */
export const getEthMainnetMarketRateUsd = async (
  symbol: string,
  tokenAddress: string,
  covalentApiKey?: string,
): Promise<number> => {
  let marketRateUsd;

  try {
    marketRateUsd = await getCoingeckoMarketRateUsd(symbol);
  } catch (err) {
    console.log(err);
  }

  try {
    if (!marketRateUsd && covalentApiKey) {
      marketRateUsd = await getCovalentMarketRateUsd(tokenAddress, covalentApiKey);
    }
  } catch (err) {
    console.log(err);
  }

  console.log('marketRateUsd');
  console.log(marketRateUsd);

  return marketRateUsd;
};

export const getCoingeckoMarketRateUsd = async (symbol: string): Promise<number> => {
  const coingeckoTicker = SYMBOL_TO_COINGECKO_LOOKUP[symbol];
  const uri = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoTicker}&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`;

  let marketRate;
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      console.log(chalk.yellow(`Unable to fetch current USD value of '${symbol}' token.`));
      throw new Error(response.statusText);
    }
    marketRate = await response.json();
    marketRate = marketRate[coingeckoTicker].usd;
  } catch (err) {
    console.log(err);
  }

  return marketRate;
};

export const getCovalentMarketRateUsd = async (
  tokenAddress: string,
  covalentApiKey: string,
): Promise<number> => {
  const address = ADDRESS_TO_COVALENT_LOOKUP[tokenAddress];

  let rateUsd;
  try {
    const url = new URL(
      `${COVALENT_API_URL}/pricing/historical_by_addresses_v2/eth-mainnet/usd/${address}/`,
    );
    url.searchParams.set('key', covalentApiKey);
    url.searchParams.set('from', getDateXDaysAgo(3));
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.log(
        chalk.yellow(
          `Unable to fetch current USD value of ETH Mainnet token with CA: '${address}'.`,
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

  return rateUsd;
};

const getDateXDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};
