import { ethers, BigNumber, Contract } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import { getSubgraphVaults, getWinnersClaims } from "@pooltogether/v5-utils-js";
import chalk from "chalk";

import {
  ContractsBlob,
  Claim,
  Token,
  ClaimPrizeContext,
  GetClaimerProfitablePrizeTxsParams,
  TiersContext
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
  roundTwoDecimalPlaces,
  parseBigNumberAsFloat
} from "./utils";
import { ERC20Abi } from "./abis/ERC20Abi";

interface ClaimPrizesParams {
  drawId: string;
  claims: Claim[];
  feeRecipient: string;
}

const NETWORK_NATIVE_TOKEN_INFO = {
  1: { decimals: 18, symbol: "ETH" },
  5: { decimals: 18, symbol: "ETH" }
};

/**
 * For testnet MarketRate contract
 */
const MARKET_RATE_CONTRACT_DECIMALS = 8;

/**
 * Only claim if we're going to make at least $5.00. This likely should be a config option
 */
const MIN_PROFIT_THRESHOLD_USD = 5;

/**
 * Finds all winners for the current draw who have unclaimed prizes and decides if it's profitable
 * to claim for them. The fees the claimer bot can earn increase exponentially over time.
 *
 * @returns {(Promise|undefined)} Promise of an array of ethers PopulatedTransaction objects or undefined
 */
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
  printAsterisks();
  console.log(chalk.blue(`2. Subgraph: Getting data ...`));
  const vaults = await getSubgraphVaults(chainId);
  if (vaults.length === 0) {
    throw new Error("Claimer: No vaults found in subgraph");
  }
  console.log(chalk.dim(`${vaults.length} vaults.`));

  // #3. Get more data about which users are winners from the contract
  printAsterisks();
  console.log(chalk.blue(`3. Multicall: Getting vault winners ...`));
  const claims: Claim[] = await getWinnersClaims(readProvider, contracts, vaults, context);
  logClaims(claims, context);
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
    context,
    chainId
  );
  if (profitable) {
    console.log(chalk.green("Claimer: Add Populated Claim Tx"));
    const tx = await claimer.populateTransaction.claimPrizes(...Object.values(claimPrizesParams));
    transactionsPopulated.push(tx);
  } else {
    console.log(chalk.yellow(`Claimer: Not profitable to claim for Draw #${context.drawId}`));
  }

  return transactionsPopulated;
}

/**
 * Figures out how much gas is required to run the contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
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

/**
 * Determines if the claim transaction will be profitable
 *
 * @returns {Promise} Promise of a boolean for profitability
 */
const calculateProfit = async (
  contracts: ContractsBlob,
  marketRate: Contract,
  claimer: Contract,
  claimPrizesParams: ClaimPrizesParams,
  readProvider: Provider,
  context: ClaimPrizeContext,
  chainId: number
): Promise<boolean> => {
  printAsterisks();
  console.log(chalk.blue("4b. Current gas costs for transaction:"));
  const ethMarketRateUsd = await getEthMarketRateUsd(contracts, marketRate);
  logStringValue("ETH Market Rate (USD):", ethMarketRateUsd);

  const estimatedGasLimit = await getEstimatedGasLimit(claimer, claimPrizesParams);
  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellow("Estimated gas limit is 0 ..."));
  } else {
    logBigNumber(
      "Estimated gas limit:",
      estimatedGasLimit,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol
    );
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

/**
 * Gather information about the given prize pool's fee token, fee token price in USD
 * and the last drawId
 * @returns {Promise} Promise of a ClaimPrizeContext object
 */
const getContext = async (
  prizePool: Contract,
  marketRate: Contract,
  readProvider: Provider
): Promise<ClaimPrizeContext> => {
  const feeTokenAddress = await prizePool.prizeToken();
  const drawId = await prizePool.getLastCompletedDrawId();

  const numberOfTiers = await prizePool.numberOfTiers();
  const rangeArray = Array.from({ length: numberOfTiers + 1 }, (value, index) => index);
  const tiers: TiersContext = { numberOfTiers, rangeArray };

  const tokenInContract = new ethers.Contract(feeTokenAddress, ERC20Abi, readProvider);

  const feeToken = {
    address: feeTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol()
  };

  const feeTokenRateUsd = await getFeeTokenRateUsd(marketRate, feeToken);

  return { feeToken, drawId, feeTokenRateUsd, tiers };
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = context => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Prize token: ${context.feeToken.symbol}`));
  printSpacer();

  logTable({ feeToken: context.feeToken });
  logTable({ tiers: context.tiers });
  logStringValue("Draw ID:", context.drawId);
  logStringValue(
    `Fee Token ${context.feeToken.symbol} MarketRate USD: `,
    `$${context.feeTokenRateUsd}`
  );
};

/**
 * Finds the spot price of the fee token in USD
 * @returns {number} feeTokenRateUsd
 */
const getFeeTokenRateUsd = async (marketRate: Contract, feeToken: Token): Promise<number> => {
  const feeTokenAddress = feeToken.address;
  const feeTokenRate = await marketRate.priceFeed(feeTokenAddress, "USD");

  return parseBigNumberAsFloat(feeTokenRate, MARKET_RATE_CONTRACT_DECIMALS);
};

const logClaims = (claims: Claim[], context: ClaimPrizeContext) => {
  const tiersArray = context.tiers.rangeArray;

  let tierClaimsFiltered: { [index: number]: Claim[] } = {};
  tiersArray.forEach(tierNum => {
    tierClaimsFiltered[tierNum] = claims.filter(claim => claim.tier === tierNum);
  });

  tiersArray.forEach(tierNum => {
    const tierClaims = tierClaimsFiltered[tierNum];
    const tierWord = tiersArray.length - 1 === tierNum ? `${tierNum} (canary)` : `${tierNum}`;
    console.table({ Tier: { "#": tierWord, "# of Winners": tierClaims.length } });
  });
};
