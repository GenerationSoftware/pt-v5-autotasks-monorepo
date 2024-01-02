import { ethers, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import chalk from 'chalk';

import { CHAIN_IDS, NETWORK_NATIVE_TOKEN_INFO } from './network';
import { GasPriceOracleAbi } from '../abis/GasPriceOracleAbi';

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

// Note: Lowercase!
const ADDRESS_TO_COVALENT_LOOKUP = {
  '0x68a100a3729fc04ab26fb4c0862df22ceec2f18b': '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e', // POOL: Sepolia -> POOL: Ethereum
  '0xf401d1482dfaa89a050f111992a222e9ad123e14': '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e', // POOL: Arb Sepolia -> POOL: Ethereum
  '0x94dc94fe29ff0e591a284619622b493fbf3a64e8': '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e', // POOL: Opt Goerli -> POOL: Ethereum
  '0x395ae52bb17aef68c2888d941736a71dc6d4e125': '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e', // POOL: Optimism -> POOL: Ethereum
  '0x779877a7b0d9e8603169ddbd7836e478b4624789': '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK: Sepolia -> LINK: Ethereum
  '0x326c977e6efc84e512bb9c30f76e30c160ed06fb': '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK: Goerli -> LINK: Ethereum
  '0x1bc266e1f397517ece9e384c55c7a5414b683639': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // wBTC: Arb Sepolia -> wBTC: Ethereum
  '0x779275fc1b987db24463801f3708f42f3c6f6ceb': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // wETH: Arb Sepolia -> wETH: Ethereum
  '0x4200000000000000000000000000000000000006': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // wETH: Optimism -> wETH: Ethereum
  '0x7f5c764cbc14f9669b88837ca1490cca17c31607': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC: Optimism -> USDC: Ethereum
  '0x7a6dbc7ff4f1a2d864291db3aec105a8eee4a3d2': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC: Arb Sepolia -> USDC: Ethereum
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI: Optimism -> DAI: Ethereum
  '0x08c19fe57af150a1af975cb9a38769848c7df98e': '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI: Arb Sepolia -> DAI: Ethereum
  '0x1a188719711d62423abf1a4de7d8aa9014a39d73': '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', // gUSD: Opt Sepolia -> gUSD: Ethereum
  '0xb84460d777133a4b86540d557db35952e4adfee7': '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd', // gUSD: Arb Sepolia -> gUSD: Ethereum
  '0xc40f949f8a4e094d1b49a23ea9241d289b7b2819': '0x5f98805a4e8be255a32880fdec7f6728c6568ba0', // lUSD: Optimism -> lUSD: Ethereum
  '0x4200000000000000000000000000000000000042': '0x2eecb20df51dc76d05afcf1270c73a2ff1035388', // OP: Optimism -> OP: Ethereum
};

const CHAIN_GAS_PRICE_MULTIPLIERS = {
  [CHAIN_IDS.mainnet]: 1,
  [CHAIN_IDS.goerli]: 0.2, // our estimates will say $6 for 2,300,000 gas limit but etherscan reports fractions of a penny
  [CHAIN_IDS.optimism]: 1,
  [CHAIN_IDS.optimismGoerli]: 1,
  [CHAIN_IDS.sepolia]: 0.1, // if we want Sepolia to act more like Optimism/etc, set this to a fraction such as 0.1
  [CHAIN_IDS.arbitrum]: 1,
  [CHAIN_IDS.arbitrumSepolia]: 1,
};

const COVALENT_API_URL = 'https://api.covalenthq.com/v1';

const marketRates = {};

/**
 * Get the current eth_gasPrice from chain provider
 *
 * @param {Provider} provider, any ethers provider
 * @returns {Promise} Promise object with gasPrice in wei
 **/
export const getGasPrice = async (provider: Provider): Promise<{ gasPrice?: BigNumber }> => {
  const gasPrice = await provider.getGasPrice();

  return { gasPrice };
};

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

  const { gasPrice } = await getGasPrice(provider);

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
export const getNativeTokenMarketRateUsd = async (chainId: number): Promise<number> => {
  return await getEthMainnetTokenMarketRateUsd(NETWORK_NATIVE_TOKEN_INFO[chainId].symbol);
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
    if (Boolean(tokenAddress) && Boolean(covalentApiKey)) {
      marketRateUsd = await getCovalentMarketRateUsd(tokenAddress, covalentApiKey);
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
