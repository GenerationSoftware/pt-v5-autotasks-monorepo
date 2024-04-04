import { ethers, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import chalk from 'chalk';

import { CHAIN_IDS, NETWORK_NATIVE_TOKEN_INFO } from '../constants/network.js';
import { ADDRESS_TO_COVALENT_LOOKUP, CHAIN_GAS_PRICE_MULTIPLIERS } from '../constants/index.js';
import { GasPriceOracleAbi } from '../abis/GasPriceOracleAbi.js';

export const MARKET_RATE_CONTRACT_DECIMALS = 8;

const GAS_PRICE_ORACLE_ADDRESS = '0x420000000000000000000000000000000000000F';

const SYMBOL_TO_COINGECKO_LOOKUP = {
  POOL: 'pooltogether',
  LINK: 'chainlink',
  ETH: 'ethereum',
  WETH: 'ethereum',
  USDC: 'usd-coin',
  DAI: 'dai',
  GUSD: 'gemini-dollar',
  OP: 'optimism',
};

const COVALENT_API_URL = 'https://api.covalenthq.com/v1';

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

  const baseFeeWei = gasPrice?.mul(estimatedGasLimit);

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
  const tokenAddress = tokenSymbol === 'ETH' ? '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' : '';

  return await getEthMainnetTokenMarketRateUsd(tokenSymbol, tokenAddress, covalentApiKey);
};

/**
 * Finds the spot price of a token in USD (from ETH Mainnet only)
 * @returns {number} tokenRateUsd
 */
export const getEthMainnetTokenMarketRateUsd = async (
  symbol: string,
  tokenAddress?: string,
  covalentApiKey?: string,
): Promise<number> => {
  // memoization
  if (marketRates[symbol]) {
    return marketRates[symbol];
  }

  let marketRateUsd;
  try {
    if (Boolean(covalentApiKey)) {
      if (Boolean(tokenAddress)) {
        marketRateUsd = await getCovalentMarketRateUsd(tokenAddress, covalentApiKey);
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
  const coingeckoTicker = SYMBOL_TO_COINGECKO_LOOKUP[symbol];
  const uri = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoTicker}&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`;

  let marketRate;
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      console.log(
        chalk.yellow(`Unable to fetch current USD value from Coingecko of '${symbol}' token.`),
      );
      throw new Error(response.statusText);
    }
    marketRate = await response.json();
    marketRate = marketRate[coingeckoTicker]?.usd;
  } catch (err) {
    console.log(err);
  }

  return marketRate;
};

export const getCovalentMarketRateUsd = async (
  tokenAddress: string,
  covalentApiKey: string,
): Promise<number> => {
  const address = ADDRESS_TO_COVALENT_LOOKUP[tokenAddress.toLowerCase()];

  let rateUsd;
  if (address) {
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
  if (chainId === CHAIN_IDS.optimism) {
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
