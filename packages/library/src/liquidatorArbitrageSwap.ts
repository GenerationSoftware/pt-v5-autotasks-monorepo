import { ethers, Contract, BigNumber } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { Relayer } from 'defender-relay-client';
import { ContractsBlob, getContract, getSubgraphVaults } from '@generationsoftware/pt-v5-utils-js';
import chalk from 'chalk';

import { ArbLiquidatorConfigParams, ArbLiquidatorContext, VaultWithContext } from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  getNativeTokenMarketRateUsd,
  roundTwoDecimalPlaces,
  getArbLiquidatorContextMulticall,
  getLiquidationPairsMulticall,
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { canUseIsPrivate, NETWORK_NATIVE_TOKEN_INFO } from './utils/network';
import { getVaultsWithContextMulticall } from './utils/getVaultsWithContextMulticall';

interface SwapExactAmountOutParams {
  liquidationPairAddress: string;
  swapRecipient: string;
  amountOut: BigNumber;
  amountInMin: BigNumber;
}

interface Stat {
  pair: string;
  estimatedProfitUsd: number;
  txHash?: string;
  error?: string;
}

/**
 * Iterates through all LiquidationPairs to see if there is any profitable arb opportunities
 *
 * Curently this does not return PopulatedTransactions like the other bots as
 * we want to send each swap transaction the instant we know if it is profitable
 * or not as we iterate through all LiquidityPairs.
 * @returns {undefined} - void function
 */
export async function liquidatorArbitrageSwap(
  contracts: ContractsBlob,
  relayer: Relayer,
  params: ArbLiquidatorConfigParams,
) {
  const {
    chainId,
    relayerAddress,
    readProvider,
    writeProvider,
    swapRecipient,
    useFlashbots,
    minProfitThresholdUsd,
  } = params;

  // #1. Get contracts
  //
  printSpacer();
  console.log('Starting ...');

  const { liquidationRouterContract, liquidationPairContracts, marketRateContract } =
    await getLiquidationContracts(contracts, params);

  printSpacer();
  console.log('Collecting information about vaults ...');

  const vaultsWithContext: VaultWithContext[] = await getVaultsContext(
    chainId,
    readProvider,
    contracts,
  );

  // Loop through all liquidation pairs
  printSpacer();
  console.log(chalk.white.bgBlack(` # of Vaults (Subgraph): ${vaultsWithContext.length} `));
  console.log(
    chalk.white.bgBlack(` # of Liquidation Pairs (RPC): ${liquidationPairContracts.length} `),
  );
  const stats: Stat[] = [];
  // for (let i = 0; i < vaults.length; i++) {
  for (let i = 0; i < liquidationPairContracts.length; i++) {
    printSpacer();
    printSpacer();
    printSpacer();
    printAsterisks();
    const liquidationPair = liquidationPairContracts[i];
    console.log(`LiquidationPair #${i + 1}`);
    console.log(liquidationPair.address);

    const liquidationPairData = contracts.contracts.find(
      (contract) => contract.type === 'LiquidationPair',
    );
    const liquidationPairContract = new ethers.Contract(
      liquidationPair.address,
      liquidationPairData.abi,
      readProvider,
    );

    // Check if we have the corresponding vault to get the underlying asset's value for determining profitability
    const vaultWithContext = vaultsWithContext.find(
      (vaultWithContext) => vaultWithContext.liquidationPair === liquidationPairContract.address,
    );
    const vaultUnderlyingAssetAddress = vaultWithContext?.asset;
    if (!vaultUnderlyingAssetAddress) {
      console.log(chalk.yellow('Could not find matching Vault for LiquidationPair'));
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    const context: ArbLiquidatorContext = await getArbLiquidatorContextMulticall(
      marketRateContract,
      liquidationRouterContract,
      liquidationPairContract,
      vaultUnderlyingAssetAddress,
      readProvider,
      relayerAddress,
    );
    const pair = `${context.tokenIn.symbol}/${context.tokenOut.symbol}`;

    printContext(context);
    printAsterisks();

    // #2. Calculate amounts
    //
    console.log(chalk.blue(`1. Amounts:`));

    const { amountOut, amountIn, amountInMin } = await calculateAmounts(
      liquidationPairContract,
      context,
    );
    if (amountOut.eq(0)) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `amountOut is 0`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #3. Print balance of tokenIn for relayer
    //
    // env.router().swapExactAmountOut(
    //   LiquidationPair(address(env.pair())),
    //   address(this),
    //   amountOut,
    //   uint(uMAX_SD59x18 / 1e18), // NOTE: uMAX_SD59x18/1e18 for DaLiquidator
    //   // type(uint).max // NOTE: type(uint).max for CgdaLiquidator
    // );

    const sufficientBalance = await checkBalance(context, amountIn);

    if (sufficientBalance) {
      console.log(chalk.green('Sufficient balance ✔'));
    } else {
      console.log(chalk.red('Insufficient balance ✗'));

      const diff = amountIn.sub(context.relayer.tokenInBalance);
      const increaseAmount = ethers.utils.formatUnits(diff, context.tokenIn.decimals);
      const errorMsg = `Relayer ${
        context.tokenIn.symbol
      } balance insufficient by ${roundTwoDecimalPlaces(Number(increaseAmount))}`;
      console.log(
        chalk.red(
          `Increase relayer '${relayerAddress}' ${context.tokenIn.symbol} balance by ${increaseAmount}`,
        ),
      );

      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: errorMsg,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #4. Get allowance approval (necessary before upcoming static call)
    //
    await approve(amountIn, liquidationRouterContract, writeProvider, relayerAddress, context);

    // #5. Test tx to get estimated return of tokenOut
    //
    // printAsterisks();
    // console.log(chalk.blue.bold(`3. Getting amount to receive ...`));
    // let amountOutEstimate;
    // try {
    //   amountOutEstimate = await liquidationRouter.callStatic.swapExactAmountIn(
    //     ...Object.values(swapExactAmountOutParams),
    //   );
    // } catch (e) {
    //   console.error(chalk.red(e));
    //   console.warn(chalk.yellow(`Unable to retrieve 'amountOutEstimate' from contract.`));
    //   stats.push({
    //     pair,
    //     estimatedProfitUsd: 0,
    //     error: `Unable to retrieve 'amountOutEstimate' from contract`,
    //   });
    //   logNextPair(liquidationPair, liquidationPairContracts);
    //   continue;
    // }
    // logBigNumber(
    //   `Estimated amount of tokenOut to receive:`,
    //   amountOutEstimate,
    //   context.tokenOut.decimals,
    //   context.tokenOut.symbol,
    // );

    // #6. Find an estimated amount of gas cost
    const swapExactAmountOutParams: SwapExactAmountOutParams = {
      liquidationPairAddress: liquidationPair.address,
      swapRecipient,
      amountOut,
      amountInMin,
    };

    let maxFeeUsd;
    try {
      maxFeeUsd = await getGasCost(
        chainId,
        liquidationRouterContract,
        swapExactAmountOutParams,
        readProvider,
      );
    } catch (e) {
      console.error(chalk.red(e));

      console.log(chalk.yellow('---'));
      console.log(chalk.yellow('Could not estimate gas costs!'));
      console.log(chalk.yellow('---'));

      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Could not get gas cost`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #7. Decide if profitable or not
    const { estimatedProfitUsd, profitable } = await calculateProfit(
      swapExactAmountOutParams,
      context,
      minProfitThresholdUsd,
      amountIn,
      maxFeeUsd,
    );
    if (!profitable) {
      console.log(
        chalk.red(
          `Liquidation Pair ${context.tokenIn.symbol}/${context.tokenOut.symbol}: currently not a profitable trade.`,
        ),
      );
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: `Not profitable`,
      });
      logNextPair(liquidationPair, liquidationPairContracts);
      continue;
    }

    // #8. Finally, populate tx when profitable
    try {
      let transactionPopulated: PopulatedTransaction | undefined;
      console.log(chalk.blue('6. Populating swap transaction ...'));
      printSpacer();

      transactionPopulated = await liquidationRouterContract.populateTransaction.swapExactAmountOut(
        ...Object.values(swapExactAmountOutParams),
      );

      const isPrivate = canUseIsPrivate(chainId, useFlashbots);
      console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));

      let transactionSentToNetwork = await relayer.sendTransaction({
        isPrivate,
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 600000,
      });
      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', transactionSentToNetwork.hash));

      stats.push({
        pair,
        estimatedProfitUsd,
        txHash: transactionSentToNetwork.hash,
      });
    } catch (error) {
      stats.push({
        pair,
        estimatedProfitUsd: 0,
        error: error.message,
      });
      throw new Error(error);
    }
  }

  printSpacer();
  printSpacer();
  printAsterisks();
  console.log(chalk.greenBright.bold(`SUMMARY`));
  console.table(stats);
  const estimatedProfitUsdTotal = stats.reduce((accumulator, stat) => {
    return accumulator + stat.estimatedProfitUsd;
  }, 0);
  console.log(
    chalk.greenBright.bold(`ESTIMATED PROFIT: $${roundTwoDecimalPlaces(estimatedProfitUsdTotal)}`),
  );
}

/**
 * Allowance - Give permission to the LiquidationRouter to spend our Relayer/SwapRecipient's
 * `tokenIn` (likely POOL). We will set allowance to max as we trust the security of the
 * LiquidationRouter contract (you may want to change this!)
 * @returns {undefined} - void function
 */
const approve = async (
  amountIn: BigNumber,
  liquidationRouter: Contract,
  writeProvider: Provider | DefenderRelaySigner,
  relayerAddress: string,
  context: ArbLiquidatorContext,
) => {
  try {
    printSpacer();
    console.log("Checking 'tokenIn' ERC20 allowance...");

    const tokenInAddress = context.tokenIn.address;
    const token = new ethers.Contract(tokenInAddress, ERC20Abi, writeProvider);

    const allowance = context.relayer.tokenInAllowance;

    if (allowance.lt(amountIn)) {
      console.log(
        chalk.bgBlack.yellowBright(
          `Increasing relayer '${relayerAddress}' ${context.tokenIn.symbol} allowance for the LiquidationRouter to maximum ...`,
        ),
      );

      const tx = await token.approve(liquidationRouter.address, ethers.constants.MaxInt256);
      await tx.wait();

      const newAllowanceResult = await token.functions.allowance(
        relayerAddress,
        liquidationRouter.address,
      );
      logStringValue('New allowance:', newAllowanceResult[0].toString());
    } else {
      console.log(chalk.green('Sufficient allowance ✔'));
    }
  } catch (error) {
    console.log(chalk.red('error: ', error));
  }
};

/**
 * Find and initialize the various contracts we will need for all liquidation pairs
 * @returns {Promise} All of the LiquidationPair contracts, the LiquidationRouter contract
 *                    and the MarketRate contract initialized as ethers contracts
 */
const getLiquidationContracts = async (
  contracts: ContractsBlob,
  params: ArbLiquidatorConfigParams,
): Promise<{
  liquidationRouterContract: Contract;
  liquidationPairContracts: Contract[];
  marketRateContract: Contract;
}> => {
  const { chainId, readProvider, writeProvider } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };

  const liquidationPairFactoryContract = getContract(
    'LiquidationPairFactory',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );
  const liquidationPairContracts = await getLiquidationPairsMulticall(
    liquidationPairFactoryContract,
    readProvider,
  );

  const liquidationRouterContract = getContract(
    'LiquidationRouter',
    chainId,
    writeProvider,
    contracts,
    contractsVersion,
  );
  const marketRateContract = getContract(
    'MarketRate',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );

  return { liquidationRouterContract, liquidationPairContracts, marketRateContract };
};

const printContext = (context) => {
  printAsterisks();
  console.log(chalk.blue(`Liquidation Pair: ${context.tokenIn.symbol}/${context.tokenOut.symbol}`));
  printSpacer();

  logTable({
    tokenIn: context.tokenIn,
    tokenOut: context.tokenOut,
    tokenOutUnderlyingAsset: context.tokenOutUnderlyingAsset,
  });
  logBigNumber(
    `Relayer ${context.tokenIn.symbol} balance:`,
    context.relayer.tokenInBalance,
    context.tokenIn.decimals,
    context.tokenIn.symbol,
  );
  logBigNumber(
    `Relayer ${context.tokenIn.symbol} allowance:`,
    context.relayer.tokenInAllowance,
    context.tokenIn.decimals,
    context.tokenIn.symbol,
  );
};

/**
 * Tests if the relayer has enough of the tokenIn to swap
 * @returns {Promise} Promise boolean if the balance is sufficient to swap
 */
const checkBalance = async (
  context: ArbLiquidatorContext,
  exactAmountIn: BigNumber,
): Promise<boolean> => {
  printAsterisks();
  console.log(chalk.blue('2. Balance & Allowance'));
  console.log("Checking relayer 'tokenIn' balance ...");

  const tokenInBalance = context.relayer.tokenInBalance;
  const sufficientBalance = tokenInBalance.gt(exactAmountIn);

  return sufficientBalance;
};

/**
 * Calculates the amount of profit the bot will make on this swap and if it's profitable or not
 * @returns {Promise} Promise boolean of profitability
 */
const calculateProfit = async (
  swapExactAmountOutParams: SwapExactAmountOutParams,
  context: ArbLiquidatorContext,
  minProfitThresholdUsd: number,
  amountIn: BigNumber,
  maxFeeUsd: number,
): Promise<{ estimatedProfitUsd: number; profitable: boolean }> => {
  const { amountOut, amountInMin } = swapExactAmountOutParams;

  printAsterisks();
  console.log(chalk.blue('5. Profit/Loss (USD):'));
  printSpacer();

  const tokenOutUnderlyingAssetUsd =
    parseFloat(ethers.utils.formatUnits(amountOut, context.tokenOut.decimals)) *
    context.tokenOutUnderlyingAsset.assetRateUsd;
  const tokenInUsd =
    parseFloat(ethers.utils.formatUnits(amountIn, context.tokenIn.decimals)) *
    context.tokenIn.assetRateUsd;

  const grossProfitUsd = tokenOutUnderlyingAssetUsd - tokenInUsd;
  const netProfitUsd = grossProfitUsd - maxFeeUsd;

  console.log(chalk.magenta('Gross profit = tokenOut - tokenIn'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(grossProfitUsd)} = $${roundTwoDecimalPlaces(
        tokenOutUnderlyingAssetUsd,
      )} - $${roundTwoDecimalPlaces(tokenInUsd)}`,
    ),
  );
  printSpacer();

  console.log(chalk.magenta('Net profit = Gross profit - Gas fee (Max)'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = $${roundTwoDecimalPlaces(
        grossProfitUsd,
      )} - $${roundTwoDecimalPlaces(maxFeeUsd)}`,
    ),
  );
  printSpacer();

  const profitable = netProfitUsd > minProfitThresholdUsd;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${minProfitThresholdUsd}`,
    'Net profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    'Profitable?': profitable ? '✔' : '✗',
  });
  printSpacer();

  return { estimatedProfitUsd: roundTwoDecimalPlaces(netProfitUsd), profitable };
};

/**
 * Get the gas cost for the tx
 * @returns {Promise} Promise with the maximum gas fee in USD
 */
const getGasCost = async (
  chainId: number,
  liquidationRouter: Contract,
  swapExactAmountOutParams: SwapExactAmountOutParams,
  readProvider: Provider,
): Promise<number> => {
  const { amountOut } = swapExactAmountOutParams;

  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);

  printAsterisks();
  console.log(chalk.blue('4. Current gas costs for transaction:'));

  const estimatedGasLimit = await liquidationRouter.estimateGas.swapExactAmountOut(
    ...Object.values(swapExactAmountOutParams),
  );

  const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    nativeTokenMarketRateUsd,
    readProvider,
  );
  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${nativeTokenMarketRateUsd}`,
  );

  printSpacer();
  logBigNumber(
    'Estimated gas limit:',
    estimatedGasLimit,
    18,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );

  logTable({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

  return maxFeeUsd;
};

/**
 * Calculates necessary input parameters for the swap call based on current state of the contracts
 * @returns {Promise} Promise object with the input parameters exactAmountIn and amountOutMin
 */
const calculateAmounts = async (
  liquidationPair: Contract,
  context: ArbLiquidatorContext,
): Promise<{
  amountOut: BigNumber;
  amountIn: BigNumber;
  amountInMin: BigNumber;
}> => {
  const amountOut = await liquidationPair.callStatic.maxAmountOut();
  logBigNumber(
    `Max amount out available:`,
    amountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol,
  );

  if (amountOut.eq(0)) {
    console.warn(
      chalk.bgBlack.yellowBright(
        `Max amount out available is 0: (Not enough interest accrued ... Is yield deposited and draws have completed?)`,
      ),
    );
    return {
      amountOut: BigNumber.from(0),
      amountIn: BigNumber.from(0),
      amountInMin: BigNumber.from(0),
    };
  }

  // Needs to be based on how much the bot owner has of tokenIn
  // as well as how big of a trade they're willing to do
  // TODO: Should this be calculated automatically or a config param?
  const divisor = 2;
  const wantedAmountOut = amountOut.div(divisor);
  logBigNumber(
    'Wanted amount out:',
    wantedAmountOut,
    context.tokenOut.decimals,
    context.tokenOut.symbol,
  );

  printSpacer();

  // Necessary for determining profit
  const amountIn = await liquidationPair.callStatic.computeExactAmountIn(wantedAmountOut);
  logBigNumber('Amount in:', amountIn, context.tokenIn.decimals, context.tokenIn.symbol);

  const amountInMin = ethers.constants.MaxInt256;

  return {
    amountOut: wantedAmountOut,
    amountIn,
    amountInMin,
  };
};

const logNextPair = (liquidationPair, liquidationPairContracts) => {
  if (liquidationPair !== liquidationPairContracts[liquidationPairContracts.length - 1]) {
    console.warn(chalk.yellow(`Moving to next pair ...`));
  }
};

const getVaultsContext = async (
  chainId: number,
  readProvider: Provider,
  contracts: ContractsBlob,
): Promise<VaultWithContext[]> => {
  const vaults = await getSubgraphVaults(chainId);

  if (vaults.length === 0) {
    throw new Error('No vaults found in subgraph');
  }

  return await getVaultsWithContextMulticall(vaults, readProvider, contracts);
};
