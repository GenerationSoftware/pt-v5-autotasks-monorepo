import { ethers, Contract, BigNumber } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { ContractsBlob, ProviderOptions } from "./types";
import { getContract, getContracts } from "./utils";
import { ERC20Abi } from "./abis/ERC20Abi";

const debug = require("debug")("pt-autotask-lib");

const MARKET_RATE_CONTRACT_DECIMALS = 8;
const MIN_PROFIT = 1; // $1.00
const PRIZE_TOKEN_PRICE_USD = 1.02; // $1.02

export async function liquidatorHandleArbSwap(
  contracts: ContractsBlob,
  config: ProviderOptions,
  swapRecipient: string
): Promise<PopulatedTransaction | undefined> {
  const { provider } = config;

  // # 1. Get contracts
  //
  const { liquidationPairs, liquidationRouter, marketRate, vaults } = getLiquidationContracts(
    contracts,
    config
  );

  // TODO: change this to loop thru pairs
  const liquidationPair = liquidationPairs[0];

  // #2. Calculate amounts
  //
  const maxAmountOut = await liquidationPair.callStatic.maxAmountOut();
  // console.log("maxAmountOut ", maxAmountOut);
  // console.log(swapRecipient);

  // Play with fraction or remove it ...
  const wantedAmountOut = maxAmountOut.div(10);
  const exactAmountIn = liquidationPair.callStatic.computeExactAmountIn(wantedAmountOut);
  const amountOutMin = liquidationPair.callStatic.computeExactAmountOut(exactAmountIn);

  // console.log("liquidationPair", liquidationPair.address);

  // prize token/pool
  const tokenInAddress = await liquidationPair.tokenIn();
  // console.log("tokenInAddress", tokenInAddress);
  const tokenInRateUsd = await marketRate.priceFeed(tokenInAddress, "USD");
  // console.log("tokenInRateUsd", tokenInRateUsd);

  // Bug in testnet contracts has POOL price at 18 decimals instead of 8 as defined in MarketRate contract
  // const tokenInRateUsdFixed = tokenInRateUsd.div("10000000000");
  // console.log("tokenInRateUsdFixed", tokenInRateUsdFixed);
  // console.log("tokenInRateUsdFixed str", tokenInRateUsdFixed.toString());

  // yield token/vault
  const tokenOutAddress = await liquidationPair.tokenOut();

  // underlying stablecoin we actually want
  const vaultContract = vaults.find((contract) => contract.address === tokenOutAddress);
  const tokenOutAsset = await vaultContract.functions.asset();
  const tokenOutAssetAddress = tokenOutAsset[0];
  const tokenOutAssetRateUsd = await marketRate.priceFeed(tokenOutAssetAddress, "USD");
  // console.log("tokenOutAssetRateUsd", tokenOutAssetRateUsd);

  // #3. Get allowance approval
  //
  // await approve(liquidationPair, liquidationRouter, swapRecipient, provider);

  // #4. Test tx to get estimated return of tokenOut
  //
  // const amountOutEstimate = await liquidationRouter.callStatic.swapExactAmountIn(
  //   liquidationPair.address,
  //   swapRecipient,
  //   exactAmountIn,
  //   amountOutMin
  // );
  // console.log("amountOutEstimate", amountOutEstimate);

  // #5. Decide if profitable or not
  //
  const ethMarketRate = await getEthMarketRate(contracts, marketRate);
  const ethMarketRateUsd = parseFloat(
    ethers.utils.formatUnits(ethMarketRate, MARKET_RATE_CONTRACT_DECIMALS)
  );

  const estimatedGasLimit = await liquidationRouter.estimateGas.swapExactAmountIn(
    liquidationPair.address,
    swapRecipient,
    exactAmountIn,
    amountOutMin
  );
  const { baseFeeUsd, maxFeeUsd } = await getBaseAndMaxFeeUsd(
    estimatedGasLimit,
    ethMarketRateUsd,
    provider
  );
  console.log({ baseFeeUsd, maxFeeUsd });

  // const gasCosts = 0.1; // Let's say gas is $0.10 for now ...
  const profitable = true;
  // const profit = amountInUsd - gasCosts;
  // const profitable = profit > MIN_PROFIT;

  // #6. Finally, populate tx when profitable
  let transactionPopulated: PopulatedTransaction | undefined;

  if (profitable) {
    // console.log(swapRecipient, exactAmountIn.toString(), amountOutMin.toString());

    // transactionPopulated = await liquidationRouter.populateTransaction.swapExactAmountIn(
    //   liquidationPair.address,
    //   swapRecipient,
    //   exactAmountIn,
    //   amountOutMin
    // );
    console.log("LiquidationPair: Swapping");
  } else {
    console.log(`LiquidationPair: Could not find a profitable trade.`);
  }

  return transactionPopulated;
}

// Allowance
//
// Give permission to the LiquidationRouter to spend our Relayer/SwapRecipient's `tokenIn` (likely POOL)
// We will set allowance to max as we trust the security of the LiquidationRouter contract
// Only set allowance if there isn't one already set ...
const approve = async (
  liquidationPair: Contract,
  liquidationRouter: Contract,
  swapRecipient: string,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider
) => {
  try {
    const tokenInAddress = await liquidationPair.tokenIn();
    console.log({ tokenInAddress });
    const token = new ethers.Contract(tokenInAddress, ERC20Abi, provider);
    console.log("maxint", ethers.constants.MaxInt256);

    let allowanceResult = await token.functions.allowance(swapRecipient, liquidationRouter.address);
    console.log("allowanceResult", allowanceResult);

    console.log(swapRecipient, liquidationRouter.address, ethers.constants.MaxInt256);

    const tx = await token.approve(liquidationRouter.address, ethers.constants.MaxInt256);
    await tx.wait();
    console.log("approve tx", tx);

    allowanceResult = await token.functions.allowance(swapRecipient, liquidationRouter.address);
    console.log("allowanceResult", allowanceResult);
  } catch (error) {
    console.log("error: ", error);
  }
};

const getLiquidationContracts = (
  contracts: ContractsBlob,
  config: ProviderOptions
): {
  liquidationPairs: Contract[];
  liquidationRouter: Contract;
  marketRate: Contract;
  vaults: Contract[];
} => {
  const { chainId, provider } = config;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  const liquidationPairs = getContracts(
    "LiquidationPair",
    chainId,
    provider,
    contracts,
    contractsVersion
  );
  const liquidationRouter = getContract(
    "LiquidationRouter",
    chainId,
    provider,
    contracts,
    contractsVersion
  );
  const marketRate = getContract("MarketRate", chainId, provider, contracts, contractsVersion);
  const vaults = getContracts("Vault", chainId, provider, contracts, contractsVersion);

  return { liquidationPairs, liquidationRouter, marketRate, vaults };
};

// On testnet: Search testnet contract blob to get wETH contract then ask MarketRate contract
// TODO: Coingecko/other on production for rates
const getEthMarketRate = async (contracts: ContractsBlob, marketRate: Contract) => {
  const wethContract = contracts.contracts.find(
    (contract) =>
      contract.tokens &&
      contract.tokens.find((token) => token.extensions.underlyingAsset.symbol === "WETH")
  );

  const wethAddress = wethContract.tokens[0].extensions.underlyingAsset.address;
  const wethRate = await marketRate.priceFeed(wethAddress, "USD");

  return wethRate;
};

const getBaseAndMaxFeeUsd = async (
  estimatedGasLimit: BigNumber,
  ethMarketRateUsd: number,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider
): Promise<{ baseFeeUsd: number; maxFeeUsd: number }> => {
  const baseFeeWei = (await provider.getFeeData()).lastBaseFeePerGas.mul(estimatedGasLimit);
  const maxFeeWei = (await provider.getFeeData()).maxFeePerGas.mul(estimatedGasLimit);

  const baseFeeUsd = parseFloat(ethers.utils.formatEther(baseFeeWei)) * ethMarketRateUsd;
  const maxFeeUsd = parseFloat(ethers.utils.formatEther(maxFeeWei)) * ethMarketRateUsd;

  return { baseFeeUsd, maxFeeUsd };
};
