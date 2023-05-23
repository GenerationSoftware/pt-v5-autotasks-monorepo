import { ethers, BigNumber, Contract } from "ethers";
import { Provider } from "@ethersproject/providers";

import { ContractsBlob } from "../types";
import { TESTNET_NETWORK_NATIVE_TOKEN_ADDRESS } from "../utils/network";

const MARKET_RATE_CONTRACT_DECIMALS = 8;

const CHAIN_GAS_PRICE_MULTIPLIERS = {
  1: 1,
  11155111: 1,
  80001: 24 // mumbai seems to return a much cheaper gas price then it bills you for
};

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
  provider: Provider
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
 * Gets the current USD value of Native Gas Token for Current Chain
 * On testnet: Search testnet contract blob to get wETH contract then ask MarketRate contract
 * TODO: 0x spot API/DEX subgraphs/other sources for production rates
 *
 * @returns {number} The spot price for the Native Gas Token in USD
 **/
export const getGasTokenMarketRateUsd = async (contracts: ContractsBlob, marketRate: Contract) => {
  // const wethContract = contracts.contracts.find(
  //   contract =>
  //     contract.tokens &&
  //     contract.tokens.find(token => token.extensions.underlyingAsset.symbol === "WETH")
  // );
  // const wethAddress = wethContract.tokens[0].extensions.underlyingAsset.address;
  // const wethRate = await marketRate.priceFeed(wethAddress, "USD");

  const nativeTokenAddress = TESTNET_NETWORK_NATIVE_TOKEN_ADDRESS;
  const gasTokenRate = await marketRate.priceFeed(nativeTokenAddress, "USD");

  return parseFloat(ethers.utils.formatUnits(gasTokenRate, MARKET_RATE_CONTRACT_DECIMALS));
};
