import { ethers, BigNumber, Contract } from "ethers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import { JsonRpcProvider } from "@ethersproject/providers";
import chalk from "chalk";

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
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider
): Promise<{ baseFeeUsd: number; maxFeeUsd: number; avgFeeUsd: number }> => {
  const baseFeeWei = (await provider.getFeeData()).lastBaseFeePerGas.mul(estimatedGasLimit);
  const maxFeeWei = (await provider.getFeeData()).maxFeePerGas.mul(estimatedGasLimit);

  const baseFeeUsd = parseFloat(ethers.utils.formatEther(baseFeeWei)) * ethMarketRateUsd;
  const maxFeeUsd = parseFloat(ethers.utils.formatEther(maxFeeWei)) * ethMarketRateUsd;

  const avgFeeUsd = (baseFeeUsd + maxFeeUsd) / 2;

  return { baseFeeUsd, maxFeeUsd, avgFeeUsd };
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
