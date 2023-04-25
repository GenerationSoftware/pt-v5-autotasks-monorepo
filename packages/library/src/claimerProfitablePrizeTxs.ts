import { ethers, BigNumber, Contract } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import chalk from "chalk";

import {
  ContractsBlob,
  Vault,
  VaultWinners,
  ClaimPrizeContext,
  GetClaimerProfitablePrizeTxsParams,
} from "./types";
import {
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getContract,
  getFeesUsd,
  getEthMarketRateUsd,
  getSubgraphVaults,
  getWinners,
  roundTwoDecimalPlaces,
} from "./utils";
import { ERC20Abi } from "./abis/ERC20Abi";

interface ClaimPrizesParams {
  vault: string;
  winners: string[];
  tiers: number[];
  minFees: BigNumber;
  feeRecipient: string;
}

const MIN_PROFIT_THRESHOLD_USD = 5; // Only claim if we're going to make at least $5.00

export async function getClaimerProfitablePrizeTxs(
  contracts: ContractsBlob,
  readProvider: Provider,
  params: GetClaimerProfitablePrizeTxsParams
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, feeRecipient } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePool = getContract("PrizePool", chainId, readProvider, contracts, contractsVersion);
  const claimer = getContract("Claimer", chainId, readProvider, contracts, contractsVersion);
  const marketRate = getContract("MarketRate", chainId, readProvider, contracts, contractsVersion);

  if (!claimer) {
    throw new Error("Claimer: Contract Unavailable");
  }

  // #1. Get context about the prize pool prize token, etc
  const context: ClaimPrizeContext = await getContext(prizePool, readProvider);
  printContext(context);

  const { feeTokenRateUsd } = await getFeeTokenRateUsd(marketRate, context);

  // #2. Get data about all user's with balances from the subgraph
  const vaults = await getVaults(chainId);
  if (vaults.length === 0) {
    throw new Error("Claimer: No vaults found in subgraph");
  }

  // #3. Get more data about which users are winners from the contract
  const vaultWinners: VaultWinners = await getVaultWinners(
    readProvider,
    contracts,
    prizePool,
    vaults
  );

  // #4. Start iterating through vaults
  printAsterisks();
  console.log(chalk.blue(`4. Processing vaults ...`));
  let transactionsPopulated: PopulatedTransaction[] | undefined = [];
  for (const vaultAddress of Object.keys(vaultWinners)) {
    printAsterisks();
    console.log(chalk.green(`Vault: '${vaultAddress}'`));

    const vault = vaultWinners[vaultAddress];
    const winners = vault.winners;
    const tiers = vault.tiers;
    const numWinners = winners.length;

    console.table({ "# of winners: ": numWinners });

    const minFees = await getMinFees(claimer, numWinners, context);
    if (!minFees || minFees.eq(0)) {
      console.error("MinFees are 0 ...");
      // continue;
    }

    const claimPrizesParams: ClaimPrizesParams = {
      vault: vaultAddress,
      winners,
      tiers,
      minFees,
      feeRecipient,
    };

    // #5. Decide if profitable or not
    const profitable = await calculateProfit(
      contracts,
      marketRate,
      claimer,
      claimPrizesParams,
      readProvider,
      context,
      feeTokenRateUsd
    );
    if (profitable) {
      console.log(chalk.green("Claimer: Add Populated Claim Tx"));
      // TODO: Don't attempt to run tx unless we know for sure it will succeed/ Flashbots?
      const tx = await claimer.populateTransaction.claimPrizes(...Object.values(claimPrizesParams));
      transactionsPopulated.push(tx);
    } else {
      console.log(chalk.yellow(`Claimer: Not profitable to claim for Vault: '${vaultAddress}'`));
    }
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

const getVaultWinners = async (
  readProvider: Provider,
  contracts: ContractsBlob,
  prizePool: Contract,
  vaults: Vault[]
): Promise<VaultWinners> => {
  printAsterisks();
  console.log(chalk.blue(`3. Multicall: Getting vault winners ...`));
  const numberOfTiers = await prizePool.numberOfTiers();
  const tiersArray = Array.from({ length: numberOfTiers + 1 }, (value, index) => index);

  // TODO: Make sure user has balance before adding them to the read multicall
  const vaultWinners: VaultWinners = await getWinners(readProvider, contracts, vaults, tiersArray);

  return vaultWinners;
};

const calculateProfit = async (
  contracts: ContractsBlob,
  marketRate: Contract,
  claimer: Contract,
  claimPrizesParams: ClaimPrizesParams,
  readProvider: Provider,
  context: ClaimPrizeContext,
  feeTokenRateUsd: number
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
  console.table({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

  printAsterisks();
  console.log(chalk.blue("4c. Profit/Loss (USD):"));
  printSpacer();

  // Get the exact amount of fees we'll get back
  let earnedFees = BigNumber.from(0);
  try {
    earnedFees = await claimer.callStatic.claimPrizes(...Object.values(claimPrizesParams));
  } catch (e) {
    console.error(e);
  }

  const earnedFeesUsd =
    parseFloat(ethers.utils.formatUnits(earnedFees, context.feeToken.decimals)) * feeTokenRateUsd;

  const netProfitUsd = earnedFeesUsd - avgFeeUsd;
  // const netProfitUsd = earnedFeesUsd - maxFeeUsd;
  console.log(chalk.magenta("Net profit = (Earned fees - Gas [Avg])"));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        earnedFeesUsd
      )} - $${roundTwoDecimalPlaces(avgFeeUsd)})`
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

// Gather information about the prize pool's fee token
//
const getContext = async (
  prizePool: Contract,
  readProvider: Provider
): Promise<ClaimPrizeContext> => {
  // 1. IN TOKEN
  const feeTokenAddress = await prizePool.prizeToken();
  const tokenInContract = new ethers.Contract(feeTokenAddress, ERC20Abi, readProvider);

  const feeToken = {
    address: feeTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol(),
  };

  return { feeToken };
};

const printContext = (context) => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Prize token: ${context.feeToken.symbol}`));
  printSpacer();

  console.table(context);
};

const getFeeTokenRateUsd = async (
  marketRate: Contract,
  context: ClaimPrizeContext
): Promise<{
  feeTokenRateUsd: number;
}> => {
  const feeTokenRateUsd = await getFeeTokenAssetRateUsd(marketRate, context);

  console.table({
    feeToken: { symbol: context.feeToken.symbol, "MarketRate USD": `$${feeTokenRateUsd}` },
  });

  return {
    feeTokenRateUsd,
  };
};

const testnetParseFloat = (amountBigNum: BigNumber, decimals: string): number => {
  return parseFloat(ethers.utils.formatUnits(amountBigNum, decimals));
};

const getFeeTokenAssetRateUsd = async (
  marketRate: Contract,
  context: ClaimPrizeContext
): Promise<number> => {
  const feeTokenAddress = context.feeToken.address;
  const feeTokenRate = await marketRate.priceFeed(feeTokenAddress, "USD");

  return testnetParseFloat(feeTokenRate, context.feeToken.decimals);
};
