import { Relayer } from "defender-relay-client";
import { ethers, Contract, BigNumber } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import chalk from "chalk";

import { ContractsBlob, ProviderOptions } from "./types";
import {
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getContract,
  getContracts,
  getFeesUsd,
  getEthMarketRateUsd,
  roundTwoDecimalPlaces,
} from "./utils";
import { ERC20Abi } from "./abis/ERC20Abi";

const MIN_PROFIT_THRESHOLD_USD = 5; // Only swap if we're going to make at least $5.00

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

type SwapExactAmountInParams = {
  liquidationPairAddress: string;
  swapRecipient: string;
  exactAmountIn: BigNumber;
  amountOutMin: BigNumber;
};

// Have this follow the same pattern as the other handlers and return populated transactions?
// ): Promise<PopulatedTransaction | undefined> {
//
export async function liquidatorHandleArbSwap(
  contracts: ContractsBlob,
  relayer: Relayer,
  swapRecipient: string,
  relayerAddress: string,
  config: ProviderOptions
) {
  const { provider } = config;

  // #1. Get contracts
  //
  const { liquidationPairs, liquidationRouter, marketRate, vaults } = getLiquidationContracts(
    contracts,
    config
  );

  // Loop through all liquidation pairs
  const i = 5;
  const liquidationPair = liquidationPairs[i];
  // for (const liquidationPair of liquidationPairs) {

  printAsterisks();
  console.log(`LiquidationPair #${i + 1}`);
  printSpacer();

  const context: Context = await getContext(liquidationPair, contracts, provider);

  printContext(context);
  printAsterisks();

  // #2. Calculate amounts
  //
  console.log(chalk.blue.bold(`1. Amounts:`));

  const { exactAmountIn, amountOutMin, tokenInAssetRateUsd, tokenOutAssetRateUsd } =
    await calculateAmounts(liquidationPair, marketRate, vaults, context);

  // #3. Test tx to get estimated return of tokenOut
  //
  const swapExactAmountInParams: SwapExactAmountInParams = {
    liquidationPairAddress: liquidationPair.address,
    swapRecipient,
    exactAmountIn,
    amountOutMin,
  };
  const amountOutEstimate = await liquidationRouter.callStatic.swapExactAmountIn(
    ...Object.values(swapExactAmountInParams)
  );
  logBigNumber(
    `Estimated amount of tokenOut to receive:`,
    amountOutEstimate,
    context.tokenOut.decimals,
    context.tokenOut.symbol
  );

  // #4. Decide if profitable or not
  //
  const profitable = await calculateProfit(
    contracts,
    marketRate,
    liquidationRouter,
    swapExactAmountInParams,
    provider,
    context,
    tokenOutAssetRateUsd,
    tokenInAssetRateUsd
  );
  if (!profitable) {
    console.log(
      chalk.red(
        `Liquidation Pair ${context.tokenIn.symbol}/${context.tokenOut.symbol}: currently not a profitable trade.`
      )
    );
    // continue;
    throw new Error();
  }

  // #5. Print balance of tokenIn for relayer
  //
  const { sufficientBalance, balanceResult } = await checkBalance(
    context,
    liquidationPair,
    provider,
    relayerAddress,
    exactAmountIn
  );

  if (sufficientBalance) {
    console.log(chalk.green("Sufficient balance ✔"));
  } else {
    console.log(chalk.red("Insufficient balance ✔"));

    const diff = exactAmountIn.sub(balanceResult);
    console.log(chalk.grey(`Increase balance by: ${diff}`));

    // continue;
  }

  // #6. Get allowance approval
  //
  await approve(exactAmountIn, liquidationPair, liquidationRouter, provider, relayerAddress);

  // #7. Finally, populate tx when profitable
  try {
    let transactionPopulated: PopulatedTransaction | undefined;
    console.log(chalk.blue("6. Populating swap transaction ..."));
    printSpacer();

    transactionPopulated = await liquidationRouter.populateTransaction.swapExactAmountIn(
      ...Object.values(swapExactAmountInParams)
    );

    let transactionSentToNetwork = await relayer.sendTransaction({
      data: transactionPopulated.data,
      to: transactionPopulated.to,
      gasLimit: 450000,
    });
    console.log(chalk.greenBright.bold("Transaction sent! ✔"));
    console.log(chalk.green("Transaction hash:", transactionSentToNetwork.hash));
  } catch (error) {
    throw new Error(error);
  }
}

// Allowance
//
// Give permission to the LiquidationRouter to spend our Relayer/SwapRecipient's `tokenIn` (likely POOL)
// We will set allowance to max as we trust the security of the LiquidationRouter contract
const approve = async (
  exactAmountIn: BigNumber,
  liquidationPair: Contract,
  liquidationRouter: Contract,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider,
  relayerAddress: string
) => {
  try {
    printSpacer();
    console.log("Checking 'tokenIn' ERC20 allowance...");

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
      console.log(chalk.green("Sufficient allowance ✔"));
    }
  } catch (error) {
    console.log(chalk.red("error: ", error));
  } finally {
    printAsterisks();
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

const testnetParseFloat = (amountBigNum: BigNumber, decimals: string): number => {
  return parseFloat(ethers.utils.formatUnits(amountBigNum, decimals));
};

const getTokenInAssetRateUsd = async (
  liquidationPair: Contract,
  marketRate: Contract,
  context: Context
): Promise<number> => {
  const tokenInAddress = await liquidationPair.tokenIn();
  const tokenInRate = await marketRate.priceFeed(tokenInAddress, "USD");

  return testnetParseFloat(tokenInRate, context.tokenIn.decimals);
};

const getTokenOutAssetRateUsd = async (
  liquidationPair: Contract,
  marketRate: Contract,
  vaults: Contract[],
  context: Context
): Promise<number> => {
  // yield token/vault
  const tokenOutAddress = await liquidationPair.tokenOut();

  // underlying stablecoin we actually want
  const vaultContract = vaults.find((contract) => contract.address === tokenOutAddress);
  const tokenOutAsset = await vaultContract.functions.asset();
  const tokenOutAssetAddress = tokenOutAsset[0];
  const tokenOutAssetRate = await marketRate.priceFeed(tokenOutAssetAddress, "USD");

  return testnetParseFloat(tokenOutAssetRate, context.tokenOut.decimals);
};

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
    symbol: await tokenInContract.symbol(),
  };

  // 2. VAULT TOKEN
  const tokenOutAddress = await liquidationPair.tokenOut();
  const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20Abi, provider);
  const tokenOut = {
    address: tokenOutAddress,
    decimals: await tokenOutContract.decimals(),
    name: await tokenOutContract.name(),
    symbol: await tokenOutContract.symbol(),
  };

  // 3. VAULT UNDERLYING ASSET TOKEN
  const vaultContract = contracts.contracts.find(
    (contract) => contract.type === "Vault" && contract.address === tokenOutAddress
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
    symbol: vaultUnderlyingAsset.symbol,
  };

  return { tokenIn, tokenOut, tokenOutUnderlyingAsset };
};

const printContext = (context) => {
  printAsterisks();
  console.log(
    chalk.blue.bold(`Liquidation Pair: ${context.tokenIn.symbol}/${context.tokenOut.symbol}`)
  );
  printSpacer();

  console.table(context);
};

const checkBalance = async (
  context: Context,
  liquidationPair: Contract,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider,
  relayerAddress: string,
  exactAmountIn: BigNumber
): Promise<{ sufficientBalance: boolean; balanceResult: BigNumber }> => {
  printAsterisks();
  console.log(chalk.blue.bold("5. Balance & Allowance"));
  console.log("Checking 'tokenIn' relayer balance ...");

  const tokenInAddress = await liquidationPair.tokenIn();
  const tokenContract = new ethers.Contract(tokenInAddress, ERC20Abi, provider);

  let balanceResult = await tokenContract.functions.balanceOf(relayerAddress);
  balanceResult = balanceResult[0];
  logBigNumber(
    `Relayer ${context.tokenIn.symbol} balance:`,
    balanceResult,
    context.tokenIn.decimals,
    context.tokenIn.symbol
  );

  const sufficientBalance = balanceResult.gt(exactAmountIn);

  return { sufficientBalance, balanceResult };
};

const calculateProfit = async (
  contracts: ContractsBlob,
  marketRate: Contract,
  liquidationRouter: Contract,
  swapExactAmountInParams: SwapExactAmountInParams,
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider,
  context: Context,
  tokenOutAssetRateUsd: number,
  tokenInAssetRateUsd: number
): Promise<Boolean> => {
  const { amountOutMin, exactAmountIn } = swapExactAmountInParams;

  const ethMarketRateUsd = await getEthMarketRateUsd(contracts, marketRate);

  printAsterisks();
  console.log(chalk.blue("3. Current gas costs for transaction:"));
  const estimatedGasLimit = await liquidationRouter.estimateGas.swapExactAmountIn(
    ...Object.values(swapExactAmountInParams)
  );
  const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
    estimatedGasLimit,
    ethMarketRateUsd,
    provider
  );
  printSpacer();
  logBigNumber("Estimated gas limit:", estimatedGasLimit, 18, "ETH");

  console.table({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

  printAsterisks();
  console.log(chalk.blue.bold("4. Profit/Loss (USD):"));
  printSpacer();

  const tokenOutUsd =
    parseFloat(ethers.utils.formatUnits(amountOutMin, context.tokenOut.decimals)) *
    tokenOutAssetRateUsd;
  const tokenInUsd =
    parseFloat(ethers.utils.formatUnits(exactAmountIn, context.tokenIn.decimals)) *
    tokenInAssetRateUsd;

  const grossProfitUsd = tokenOutUsd - tokenInUsd;
  const netProfitUsd = grossProfitUsd - maxFeeUsd;

  console.log(chalk.magenta("Gross profit = tokenOut - tokenIn"));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(grossProfitUsd)} = $${roundTwoDecimalPlaces(
        tokenOutUsd
      )} - $${roundTwoDecimalPlaces(tokenInUsd)}`
    )
  );
  printSpacer();

  console.log(chalk.magenta("Net profit = Gross profit - Gas fee (Max)"));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = $${roundTwoDecimalPlaces(
        grossProfitUsd
      )} - $${roundTwoDecimalPlaces(maxFeeUsd)}`
    )
  );
  printSpacer();

  const profitable = netProfitUsd > MIN_PROFIT_THRESHOLD_USD;
  console.table({
    MIN_PROFIT_THRESHOLD_USD: `$${MIN_PROFIT_THRESHOLD_USD}`,
    "Net profit (USD)": `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    "Profitable?": profitable ? "✔" : "✗",
  });
  printSpacer();

  return profitable;
};

const calculateAmounts = async (
  liquidationPair: Contract,
  marketRate: Contract,
  vaults: Contract[],
  context: Context
): Promise<{
  exactAmountIn: BigNumber;
  amountOutMin: BigNumber;
  tokenInAssetRateUsd: number;
  tokenOutAssetRateUsd: number;
}> => {
  const maxAmountOut = await liquidationPair.callStatic.maxAmountOut();
  logBigNumber(
    `Max amount out available:`,
    maxAmountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol
  );

  // Needs to be based on how much the bot owner has of tokenIn
  // as well as how big of a trade they're willing to do
  const divisor = 1;
  if (divisor !== 1) {
    logStringValue("Divide max amount out by:", Math.round(divisor));
  }
  const wantedAmountOut = maxAmountOut.div(divisor);
  logBigNumber(
    "Wanted amount out:",
    wantedAmountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol
  );
  printSpacer();

  const exactAmountIn = await liquidationPair.callStatic.computeExactAmountIn(wantedAmountOut);
  logBigNumber("Exact amount in:", exactAmountIn, context.tokenIn.decimals, context.tokenIn.symbol);

  const amountOutMin = await liquidationPair.callStatic.computeExactAmountOut(exactAmountIn);
  logBigNumber(
    "Amount out minimum:",
    amountOutMin,
    context.tokenOut.decimals,
    context.tokenOut.symbol
  );

  printAsterisks();
  console.log(chalk.blue.bold(`2. Market rates:`));

  // prize token/pool
  const tokenInAssetRateUsd = await getTokenInAssetRateUsd(liquidationPair, marketRate, context);

  // yield token/vault
  // TODO: This will need to take into account the underlying asset instead and calculate
  // how much of that you can get for the amountOutMin of these shares
  const tokenOutAssetRateUsd = await getTokenOutAssetRateUsd(
    liquidationPair,
    marketRate,
    vaults,
    context
  );

  console.table({
    tokenIn: { symbol: context.tokenIn.symbol, "MarketRate USD": `$${tokenInAssetRateUsd}` },
    tokenOut: { symbol: context.tokenOut.symbol, "MarketRate USD": `$${tokenOutAssetRateUsd}` },
  });

  return {
    exactAmountIn,
    amountOutMin,
    tokenInAssetRateUsd,
    tokenOutAssetRateUsd,
  };
};
