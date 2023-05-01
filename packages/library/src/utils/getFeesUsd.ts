import { ethers, BigNumber, Contract } from "ethers";
import { Provider } from "@ethersproject/providers";

import { ContractsBlob } from "../types";

const MARKET_RATE_CONTRACT_DECIMALS = 8;

/**
 * Gather info on current fees from the chain
 *
 * @param {BigNumber} estimatedGasLimit, how much gas the function is estimated to use (in wei)
 * @param {ethMarketRateUsd} context, provided from MarketRate contract or from an API
 * @param {Provider} provider, any ethers provider
 * @returns {Promise} Promise object with recent baseFeeUsd & maxFeeUsd from the chain
 *                    while avgFeeUsd is in between the two
 **/
export const getFeesUsd = async (
  estimatedGasLimit: BigNumber,
  ethMarketRateUsd: number,
  provider: Provider
): Promise<{ baseFeeUsd: number; maxFeeUsd: number; avgFeeUsd: number }> => {
  const fees = { baseFeeUsd: null, maxFeeUsd: null, avgFeeUsd: null };

  const feeData = await provider.getFeeData();

  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    return fees;
  }

  const baseFeeWei = feeData.lastBaseFeePerGas?.mul(estimatedGasLimit);
  const maxFeeWei = feeData.maxFeePerGas?.mul(estimatedGasLimit);

  fees.baseFeeUsd = parseFloat(ethers.utils.formatEther(baseFeeWei)) * ethMarketRateUsd;
  fees.maxFeeUsd = parseFloat(ethers.utils.formatEther(maxFeeWei)) * ethMarketRateUsd;
  fees.avgFeeUsd = (fees.baseFeeUsd + fees.maxFeeUsd) / 2;

  return fees;
};

/**
 * Gets the current USD value of ETH
 * On testnet: Search testnet contract blob to get wETH contract then ask MarketRate contract
 * TODO: 0x spot API/DEX subgraphs/other sources for production rates
 *
 * @returns {number} The spot price for ETH in USD
 **/
export const getEthMarketRateUsd = async (contracts: ContractsBlob, marketRate: Contract) => {
  const wethContract = contracts.contracts.find(
    contract =>
      contract.tokens &&
      contract.tokens.find(token => token.extensions.underlyingAsset.symbol === "WETH")
  );

  const wethAddress = wethContract.tokens[0].extensions.underlyingAsset.address;
  const wethRate = await marketRate.priceFeed(wethAddress, "USD");

  return parseFloat(ethers.utils.formatUnits(wethRate, MARKET_RATE_CONTRACT_DECIMALS));
};
