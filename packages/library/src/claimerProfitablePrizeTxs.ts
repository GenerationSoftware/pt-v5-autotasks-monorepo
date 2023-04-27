import { ethers, BigNumber, Contract } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import chalk from "chalk";

import {
  ContractsBlob,
  Claim,
  Vault,
  Token,
  ClaimPrizeContext,
  GetClaimerProfitablePrizeTxsParams
} from "./types";
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getContract,
  getFeesUsd,
  getEthMarketRateUsd,
  getSubgraphVaults,
  getWinners,
  roundTwoDecimalPlaces
} from "./utils";
import { ERC20Abi } from "./abis/ERC20Abi";

interface ClaimPrizesParams {
  drawId: string;
  claims: Claim[];
  feeRecipient: string;
}

const MARKET_RATE_CONTRACT_DECIMALS = 8;
const MIN_PROFIT_THRESHOLD_USD = -300; // Only claim if we're going to make at least $5.00

export async function getClaimerProfitablePrizeTxs(
  contracts: ContractsBlob,
  readProvider: Provider,
  params: GetClaimerProfitablePrizeTxsParams
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, feeRecipient } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0
  };
  const prizePool = getContract("PrizePool", chainId, readProvider, contracts, contractsVersion);
  const claimer = getContract("Claimer", chainId, readProvider, contracts, contractsVersion);
  const marketRate = getContract("MarketRate", chainId, readProvider, contracts, contractsVersion);

  if (!claimer) {
    throw new Error("Claimer: Contract Unavailable");
  }

  // #1. Get context about the prize pool prize token, etc
  const context: ClaimPrizeContext = await getContext(prizePool, marketRate, readProvider);
  printContext(context);

  // #2. Get data about all user's with balances from the subgraph
  const vaults = await getVaults(chainId);
  if (vaults.length === 0) {
    throw new Error("Claimer: No vaults found in subgraph");
  }
  console.log(chalk.dim(`${vaults.length} vaults.`));

  // #3. Get more data about which users are winners from the contract
  const claims: Claim[] = await getVaultWinnersClaims(readProvider, contracts, prizePool, vaults);

  console.log(chalk.dim(`${claims.length} winners.`));

  // #4. Start iterating through vaults
  printAsterisks();
  console.log(chalk.blue(`4. Processing claims ...`));
  let transactionsPopulated: PopulatedTransaction[] | undefined = [];

  const claimPrizesParams: ClaimPrizesParams = {
    drawId: context.drawId,
    claims,
    feeRecipient
  };

  // #5. Decide if profitable or not
  const profitable = await calculateProfit(
    contracts,
    marketRate,
    claimer,
    claimPrizesParams,
    readProvider,
    context
  );
  if (profitable) {
    console.log(chalk.green("Claimer: Add Populated Claim Tx"));
    // TODO: Don't attempt to run tx unless we know for sure it will succeed/ Flashbots?
    const tx = await claimer.populateTransaction.claimPrizes(...Object.values(claimPrizesParams));
    transactionsPopulated.push(tx);
  } else {
    console.log(chalk.yellow(`Claimer: Not profitable to claim for Draw #${context.drawId}`));
  }

  return transactionsPopulated;
}

const getMinFees = async (
  claimer: Contract,
  numWinners: number,
  context: ClaimPrizeContext
): Promise<BigNumber> => {
  let minFees = BigNumber.from(0);
  try {
    minFees = await claimer.callStatic.estimateFees(numWinners);
    logBigNumber(
      "MinFees:",
      minFees.toString(),
      context.feeToken.decimals,
      context.feeToken.symbol
    );
  } catch (e) {
    console.error(chalk.red(e));
  }

  return minFees;
};

const getEstimatedGasLimit = async (
  claimer: Contract,
  claimPrizesParams: ClaimPrizesParams
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await claimer.estimateGas.claimPrizes(...Object.values(claimPrizesParams));
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
};

const getVaults = async (chainId: number) => {
  printAsterisks();
  console.log(chalk.blue(`2. Subgraph: Getting data ...`));
  return await getSubgraphVaults(chainId);
};

const getVaultWinnersClaims = async (
  readProvider: Provider,
  contracts: ContractsBlob,
  prizePool: Contract,
  vaults: Vault[]
): Promise<Claim[]> => {
  printAsterisks();
  console.log(chalk.blue(`3. Multicall: Getting vault winners ...`));
  const numberOfTiers = await prizePool.numberOfTiers();
  const tiersArray = Array.from({ length: numberOfTiers + 1 }, (value, index) => index);

  // TODO: Make sure user has balance before adding them to the read multicall
  const claims: Claim[] = await getWinners(readProvider, contracts, vaults, tiersArray);

  return claims;
};

const calculateProfit = async (
  contracts: ContractsBlob,
  marketRate: Contract,
  claimer: Contract,
  claimPrizesParams: ClaimPrizesParams,
  readProvider: Provider,
  context: ClaimPrizeContext
): Promise<boolean> => {
  printAsterisks();
  console.log(chalk.blue("4b. Current gas costs for transaction:"));
  const ethMarketRateUsd = await getEthMarketRateUsd(contracts, marketRate);
  logStringValue("ETH Market Rate (USD):", ethMarketRateUsd);

  const estimatedGasLimit = await getEstimatedGasLimit(claimer, claimPrizesParams);
  // TODO: Don't hardcode 18 and ETH here, depending on chain ...
  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellow("Estimated gas limit is 0 ..."));
    // continue;
  } else {
    logBigNumber("Estimated gas limit:", estimatedGasLimit, 18, "ETH");
  }

  const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
    estimatedGasLimit,
    ethMarketRateUsd,
    readProvider
  );
  logTable({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

  printAsterisks();
  console.log(chalk.blue("4c. Profit/Loss (USD):"));
  printSpacer();

  // Get the exact amount of fees we'll get back
  let totalFees = BigNumber.from(0);
  try {
    const staticResult = await claimer.callStatic.claimPrizes(...Object.values(claimPrizesParams));
    totalFees = staticResult.totalFees;
  } catch (e) {
    console.error(e);
  }

  const totalFeesUsd =
    parseFloat(ethers.utils.formatUnits(totalFees, context.feeToken.decimals)) *
    context.feeTokenRateUsd;
  logBigNumber(
    "TotalFees:",
    totalFees.toString(),
    context.feeToken.decimals,
    context.feeToken.symbol
  );
  console.log(chalk.green("TotalFees:", `$${roundTwoDecimalPlaces(totalFeesUsd)}`));

  printSpacer();

  const netProfitUsd = totalFeesUsd - avgFeeUsd;
  console.log(chalk.magenta("Net profit = (Earned fees - Gas [Avg])"));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        totalFeesUsd
      )} - $${roundTwoDecimalPlaces(avgFeeUsd)})`
    )
  );
  printSpacer();

  const profitable = netProfitUsd > MIN_PROFIT_THRESHOLD_USD;
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${MIN_PROFIT_THRESHOLD_USD}`,
    "Net profit (USD)": `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    "Profitable?": profitable ? "✔" : "✗"
  });
  printSpacer();

  return profitable;
};

// Gather information about the prize pool's fee token
//
const getContext = async (
  prizePool: Contract,
  marketRate: Contract,
  readProvider: Provider
): Promise<ClaimPrizeContext> => {
  const feeTokenAddress = await prizePool.prizeToken();
  const drawId = await prizePool.getLastCompletedDrawId();

  const tokenInContract = new ethers.Contract(feeTokenAddress, ERC20Abi, readProvider);

  const feeToken = {
    address: feeTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol()
  };

  const { feeTokenRateUsd } = await getFeeTokenRateUsd(marketRate, feeToken);

  return { feeToken, drawId, feeTokenRateUsd };
};

const printContext = context => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Prize token: ${context.feeToken.symbol}`));
  printSpacer();

  logTable({ feeToken: context.feeToken });
  logStringValue("Draw ID:", context.drawId);
  logStringValue(
    `Fee Token ${context.feeToken.symbol} MarketRate USD: `,
    `$${context.feeTokenRateUsd}`
  );
};

const getFeeTokenRateUsd = async (
  marketRate: Contract,
  feeToken: Token
): Promise<{
  feeTokenRateUsd: number;
}> => {
  const feeTokenRateUsd = await getFeeTokenAssetRateUsd(marketRate, feeToken);

  return {
    feeTokenRateUsd
  };
};

const testnetParseFloat = (amountBigNum: BigNumber, decimals: number): number => {
  return parseFloat(ethers.utils.formatUnits(amountBigNum, decimals));
};

const getFeeTokenAssetRateUsd = async (marketRate: Contract, feeToken: Token): Promise<number> => {
  const feeTokenAddress = feeToken.address;
  const feeTokenRate = await marketRate.priceFeed(feeTokenAddress, "USD");

  return testnetParseFloat(feeTokenRate, MARKET_RATE_CONTRACT_DECIMALS);
};
