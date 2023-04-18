import { ethers, BigNumber, Contract } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import chalk from "chalk";

import { ContractsBlob, ProviderOptions, Vault, VaultAccount, VaultWinners } from "./types";
import {
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getContract,
  getContracts,
  getFeesUsd,
  getEthMarketRateUsd,
  getTwabControllerSubgraphClient,
  getSubgraphVaults,
  getWinners,
} from "./utils";

interface ClaimPrizesParams {
  vault: string;
  winners: string[];
  tiers: number[];
  minFees: BigNumber;
  feeRecipient: string;
}

export async function claimerHandleClaimPrize(
  contracts: ContractsBlob,
  feeRecipient: string,
  config: any
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, provider } = config;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePool = getContract("PrizePool", chainId, provider, contracts, contractsVersion);
  const claimer = getContract("Claimer", chainId, provider, contracts, contractsVersion);
  const marketRate = getContract("MarketRate", chainId, provider, contracts, contractsVersion);

  if (!claimer) {
    throw new Error("Claimer: Contract Unavailable");
  }

  // #1. Get data about all user's with balances from the subgraph
  const vaults = await getVaults(chainId);
  if (vaults.length === 0) {
    throw new Error("Claimer: No vaults found in subgraph");
  }

  // #2. Get more data about which users are winners from the contract
  const vaultWinners: VaultWinners = await getVaultWinners(contracts, prizePool, vaults);

  // #3. Start iterating through vaults
  printAsterisks();
  console.log(chalk.blue(`3. Processing vaults ...`));
  let transactionsPopulated: PopulatedTransaction[] | undefined = [];
  for (const key of Object.keys(vaultWinners)) {
    printSpacer();
    console.log(chalk.green(`Vault: '${key}'`));

    const vault = vaultWinners[key];
    const winners = vault.winners;
    const tiers = vault.tiers;
    const numWinners = winners.length;

    console.table({ "# of winners: ": numWinners });

    const minFees = await getMinFees(claimer, numWinners);
    if (!minFees || minFees.eq(0)) {
      console.error(chalk.yellow("Fees are 0 ..."));
      continue;
    }

    const claimPrizesParams: ClaimPrizesParams = {
      vault: key,
      winners,
      tiers,
      minFees,
      feeRecipient,
    };

    const ethMarketRateUsd = await getEthMarketRateUsd(contracts, marketRate);
    console.log("ethMarketRateUsd");
    console.log(ethMarketRateUsd);

    const estimatedGasLimit = await getEstimatedGasLimit(claimer, claimPrizesParams);
    if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
      console.error(chalk.yellow("Estimated gas limit is 0 ..."));
      continue;
    }

    const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
      estimatedGasLimit,
      ethMarketRateUsd,
      provider
    );

    printAsterisks();
    console.log(chalk.blue("4. Current gas costs for transaction:"));
    console.table({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

    // #4. Ask for the exact amount of fees we'll get back, prob not needed?
    const earnedFees = await claimer.callStatic.claimPrizes(...Object.values(claimPrizesParams));
    console.log("earnedFees ? ", earnedFees);
    console.log("earnedFees ? ", earnedFees.toString());

    // TODO: Is profitable?
    //
    const profitable = true;

    if (profitable) {
      console.log(chalk.yellow("Claimer: Add Populated Claim Tx"));
      // TODO: Don't attempt to run tx unless we know for sure it will succeed/ Flashbots?
      const tx = await claimer.populateTransaction.claimPrizes(...Object.values(claimPrizesParams));
      transactionsPopulated.push(tx);
    } else {
      console.log(`Claimer: No Prizes found to claim for Vault: ${vault}.`);
    }
  }

  return transactionsPopulated;
}

const getMinFees = async (claimer: Contract, numWinners: number): Promise<BigNumber> => {
  let minFees;
  try {
    minFees = await claimer.callStatic.estimateFees(numWinners);
    console.log(chalk.green(minFees));
    console.log(minFees.toString());
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
    console.log("estimatedGasLimit ? ", estimatedGasLimit);
    console.log(estimatedGasLimit.toString());
  } catch (e) {
    console.log(chalk.red(e));
  }

  return estimatedGasLimit;
};

const getVaults = async (chainId: number) => {
  printAsterisks();
  console.log(chalk.blue(`1. Subgraph: Getting data ...`));
  return await getSubgraphVaults(chainId);
};

const getVaultWinners = async (
  contracts: ContractsBlob,
  prizePool: Contract,
  vaults: Vault[]
): Promise<VaultWinners> => {
  printAsterisks();
  console.log(chalk.blue(`2. Multicall: Getting vault winners ...`));
  const numberOfTiers = await prizePool.numberOfTiers();
  const tiersArray = Array.from({ length: numberOfTiers + 1 }, (value, index) => index);

  // TODO: Don't hardcode goerli
  const infuraProvider = new ethers.providers.InfuraProvider("goerli", process.env.INFURA_API_KEY);
  // TODO: Make sure user has balance before adding them to the read multicall
  const vaultWinners: VaultWinners = await getWinners(
    infuraProvider,
    contracts,
    vaults,
    tiersArray
  );

  return vaultWinners;
};
