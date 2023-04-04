import { ethers, Contract, BigNumber } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import chalk from "chalk";

import { ContractsBlob, ProviderOptions } from "./types";
import { logStringValue, logBigNumber, getContract, getContracts } from "./utils";
import { ERC20Abi } from "./abis/ERC20Abi";

const MARKET_RATE_CONTRACT_DECIMALS = 8;
const MIN_PROFIT_THRESHOLD = 5; // Only swap if we're going to make at least $5.00

type Token = {
  name: string;
  decimals: string;
  address: string;
  symbol: string;
};

type Context = {
  tokenIn: Token;
  tokenOut: Token;
  tokenOutUnderlyingAsset: Token;
};

export async function liquidatorHandleArbSwap(
  contracts: ContractsBlob,
  config: ProviderOptions,
  swapRecipient: string,
  relayerAddress: string
): Promise<PopulatedTransaction | undefined> {
  const { provider } = config;

  // # 1. Get contracts
  //
  const { liquidationPairs, liquidationRouter, marketRate, vaults } = getLiquidationContracts(
    contracts,
    config
  );

  // TODO: change this to loop thru pairs
  const liquidationPair = liquidationPairs[6];
  const context: Context = await getContext(liquidationPair, contracts, provider);
  printContext(context);

  // #2. Calculate amounts
  //
  const maxAmountOut = await liquidationPair.callStatic.maxAmountOut();
  logBigNumber(
    `Max Amount tokenOut Available:`,
    maxAmountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol
  );

  // TODO: Play with fraction (or remove it) ...
  // ... likely needs to be based on how much the bot owner has of tokenIn
  // as well as how big of a trade they're willing to do
  const divisor = 10;
  logStringValue("Dividing Max Amount tokenOut Available by:", divisor);

  const wantedAmountOut = maxAmountOut.div(divisor);
  logBigNumber(
    "Wanted Amount tokenOut:",
    wantedAmountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol
  );

  const exactAmountIn = await liquidationPair.callStatic.computeExactAmountIn(wantedAmountOut);
  logBigNumber(
    "Exact Amount tokenIn:",
    exactAmountIn,
    context.tokenIn.decimals,
    context.tokenIn.symbol
  );

  const amountOutMin = await liquidationPair.callStatic.computeExactAmountOut(exactAmountIn);
  logBigNumber(
    "Amount tokenOut Minimum:",
    amountOutMin,
    context.tokenOut.decimals,
    context.tokenOut.symbol
  );

  // prize token/pool
  const tokenInAssetRateUsd = await getTokenInAssetRateUsd(liquidationPair, marketRate);
  logStringValue("TokenIn AssetRate USD:", tokenInAssetRateUsd);

  // yield token/vault
  const tokenOutAssetRateUsd = await getTokenOutAssetRateUsd(liquidationPair, vaults, marketRate);
  logStringValue("TokenOut AssetRate USD:", tokenOutAssetRateUsd);

  // #3. Print balanceOf tokenIn for relayer
  //
  await printBalanceOf(context, liquidationPair, provider, relayerAddress);

  // #4. Get allowance approval
  //
  await approve(exactAmountIn, liquidationPair, liquidationRouter, provider, relayerAddress);

  // #4. Test tx to get estimated return of tokenOut
  //
  const amountOutEstimate = await liquidationRouter.callStatic.swapExactAmountIn(
    liquidationPair.address,
    swapRecipient,
    exactAmountIn,
    amountOutMin
  );
  logBigNumber(
    `Estimated amount of tokenOut to receive:`,
    amountOutEstimate,
    context.tokenOut.decimals,
    context.tokenOut.symbol
  );

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
  const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
    estimatedGasLimit,
    ethMarketRateUsd,
    provider
  );

  printSpacer();
  console.log(chalk.blue("Current gas costs for transaction:"));
  console.table({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

  printSpacer();
  console.log(chalk.magenta("Profit/Loss:"));
  const tokenOutUsd =
    parseFloat(ethers.utils.formatUnits(amountOutMin, context.tokenOut.decimals)) *
    tokenOutAssetRateUsd;
  const tokenInUsd =
    parseFloat(ethers.utils.formatUnits(exactAmountIn, context.tokenIn.decimals)) *
    tokenInAssetRateUsd;
  const grossProfitUsd = tokenOutUsd - tokenInUsd;

  const profit = grossProfitUsd - maxFeeUsd;
  const profitable = profit > MIN_PROFIT_THRESHOLD;
  console.table({ profit, profitable });

  // #6. Finally, populate tx when profitable
  let transactionPopulated: PopulatedTransaction | undefined;

  if (profitable) {
    console.log("LiquidationPair: Populating swap transaction ...");
    // console.log(swapRecipient, exactAmountIn.toString(), amountOutMin.toString());

    // transactionPopulated = await liquidationRouter.populateTransaction.swapExactAmountIn(
    //   liquidationPair.address,
    //   swapRecipient,
    //   exactAmountIn,
    //   amountOutMin
    // );
  } else {
    console.log(`LiquidationPair: Could not find a profitable trade.`);
  }

  return transactionPopulated;
}

// Allowance
//
// Give permission to the LiquidationRouter to spend our Relayer/SwapRecipient's `tokenIn` (likely POOL)
// We will set allowance to max as we trust the security of the LiquidationRouter contract
// TODO: Only set allowance if there isn't one already set ...
const approve = async (
  exactAmountIn: BigNumber,
  liquidationPair: Contract,
  liquidationRouter: Contract,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider,
  relayerAddress: string
) => {
  try {
    printSpacer();
    console.log(chalk.blue.bold("Checking 'tokenIn' ERC20 allowance..."));

    const tokenInAddress = await liquidationPair.tokenIn();
    const token = new ethers.Contract(tokenInAddress, ERC20Abi, provider);

    let allowanceResult = await token.functions.allowance(
      relayerAddress,
      liquidationRouter.address
    );
    allowanceResult = allowanceResult[0];
    logStringValue("Existing allowance:", allowanceResult.toString());

    if (allowanceResult.lt(exactAmountIn)) {
      const tx = await token.approve(liquidationRouter.address, ethers.constants.MaxInt256);
      await tx.wait();

      allowanceResult = await token.functions.allowance(relayerAddress, liquidationRouter.address);
      logStringValue("New allowance:", allowanceResult[0].toString());
    } else {
      console.log(chalk.blue.bold("Sufficient allowance ✓"));
    }
  } catch (error) {
    console.log(chalk.red("error: ", error));
  } finally {
    printSpacer();
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
    patch: 0
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
    contract =>
      contract.tokens &&
      contract.tokens.find(token => token.extensions.underlyingAsset.symbol === "WETH")
  );

  const wethAddress = wethContract.tokens[0].extensions.underlyingAsset.address;
  const wethRate = await marketRate.priceFeed(wethAddress, "USD");

  return wethRate;
};

const getFeesUsd = async (
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

const testnetParseFloat = (amountBigNum: BigNumber): number => {
  return parseFloat(ethers.utils.formatUnits(amountBigNum, MARKET_RATE_CONTRACT_DECIMALS));
};

const getTokenInAssetRateUsd = async (
  liquidationPair: Contract,
  marketRate: Contract
): Promise<number> => {
  const tokenInAddress = await liquidationPair.tokenIn();
  const tokenInRate = await marketRate.priceFeed(tokenInAddress, "USD");

  return testnetParseFloat(tokenInRate);
};

const getTokenOutAssetRateUsd = async (
  liquidationPair: Contract,
  vaults: Contract[],
  marketRate: Contract
): Promise<number> => {
  // yield token/vault
  const tokenOutAddress = await liquidationPair.tokenOut();

  // underlying stablecoin we actually want
  const vaultContract = vaults.find(contract => contract.address === tokenOutAddress);
  const tokenOutAsset = await vaultContract.functions.asset();
  const tokenOutAssetAddress = tokenOutAsset[0];
  const tokenOutAssetRate = await marketRate.priceFeed(tokenOutAssetAddress, "USD");

  return testnetParseFloat(tokenOutAssetRate);
};

// const logStringValue = (str: string, val: any) => {
//   console.log(chalk.green(str), chalk.yellow(val));
// };

// const logBigNumber = (title, bigNumber, decimals) => {
//   const formatted = ethers.utils.formatUnits(bigNumber, decimals);

//   logStringValue(title, `${formatted} (${bigNumber.toString()} wei)`);
// };

// Gather information about this specific liquidation pair
// This is complicated because tokenIn is the token to supply (likely the prize token, which is probably POOL),
// while tokenOut is the Vault/Yield token, not the underlying asset which is likely the desired token (ie. DAI, USDC)
//
const getContext = async (
  liquidationPair: Contract,
  contracts: ContractsBlob,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider
): Promise<Context> => {
  // 1. IN TOKEN
  const tokenInAddress = await liquidationPair.tokenIn();
  const tokenInContract = new ethers.Contract(tokenInAddress, ERC20Abi, provider);

  const tokenIn = {
    address: tokenInAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol()
  };

  // 2. VAULT TOKEN
  const tokenOutAddress = await liquidationPair.tokenOut();
  const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20Abi, provider);
  const tokenOut = {
    address: tokenOutAddress,
    decimals: await tokenOutContract.decimals(),
    name: await tokenOutContract.name(),
    symbol: await tokenOutContract.symbol()
  };

  // 3. VAULT UNDERLYING ASSET TOKEN
  const vaultContract = contracts.contracts.find(
    contract => contract.type === "Vault" && contract.address === tokenOutAddress
  );
  const vaultUnderlyingAsset = vaultContract.tokens[0].extensions.underlyingAsset;

  const tokenOutUnderlyingAssetContract = new ethers.Contract(
    vaultUnderlyingAsset.address,
    ERC20Abi,
    provider
  );

  const tokenOutUnderlyingAsset = {
    address: vaultUnderlyingAsset.address,
    decimals: await tokenOutUnderlyingAssetContract.decimals(),
    name: vaultUnderlyingAsset.name,
    symbol: vaultUnderlyingAsset.symbol
  };

  return { tokenIn, tokenOut, tokenOutUnderlyingAsset };
};

const printContext = context => {
  printSpacer();
  console.log(
    chalk.blue.bold(`Liquidation Pair: ${context.tokenIn.symbol}/${context.tokenOut.symbol}`)
  );
  console.table(context);
  printSpacer();
};

const printBalanceOf = async (
  context: Context,
  liquidationPair: Contract,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider,
  relayerAddress: string
) => {
  printSpacer();
  console.log(chalk.blue.bold("Checking 'tokenIn' relayer balance ..."));

  const tokenInAddress = await liquidationPair.tokenIn();
  const tokenContract = new ethers.Contract(tokenInAddress, ERC20Abi, provider);

  let allowanceResult = await tokenContract.functions.balanceOf(relayerAddress);
  allowanceResult = allowanceResult[0];
  logBigNumber(
    `Relayer ${context.tokenIn.symbol} balance:`,
    allowanceResult,
    context.tokenIn.decimals,
    context.tokenIn.symbol
  );

  console.log(chalk.blue.bold("Sufficient balance ✓"));
};

const printSpacer = () => {
  console.log("");
  console.log(chalk.blue("******************"));
};
