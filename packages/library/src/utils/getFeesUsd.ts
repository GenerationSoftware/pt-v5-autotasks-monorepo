import { ethers, BigNumber, Contract } from "ethers";
import { Provider } from "@ethersproject/providers";

import { ContractsBlob } from "../types";

const MARKET_RATE_CONTRACT_DECIMALS = 8;

/// @notice Gather info on current fees from the chain
/// @param estimatedGasLimit: how much gas the function is estimated to use (in wei)
/// @param ethMarketRateUsd: provided from MarketRate contract or from an API
/// @param provider: eth provider
/// @return baseFeeUsd, maxFeeUsd, avgFeeUsd
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

// On testnet: Search testnet contract blob to get wETH contract then ask MarketRate contract
// TODO: Coingecko/0x spot API/other for production rates
export const getEthMarketRateUsd = async (contracts: ContractsBlob, marketRate: Contract) => {
  const wethContract = contracts.contracts.find(
    (contract) =>
      contract.tokens &&
      contract.tokens.find((token) => token.extensions.underlyingAsset.symbol === "WETH")
  );

  const wethAddress = wethContract.tokens[0].extensions.underlyingAsset.address;
  const wethRate = await marketRate.priceFeed(wethAddress, "USD");

  return parseFloat(ethers.utils.formatUnits(wethRate, MARKET_RATE_CONTRACT_DECIMALS));
};
