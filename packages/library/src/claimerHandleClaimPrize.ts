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
  getVaults,
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
  // const vaults = getContracts("Vault", chainId, provider, contracts, contractsVersion);
  const marketRate = getContract("MarketRate", chainId, provider, contracts, contractsVersion);

  if (!claimer) {
    throw new Error("Claimer: Contract Unavailable");
  }

  console.log(chalk.blue(`Subgraph: Getting data ...`));
  const client = getTwabControllerSubgraphClient(chainId);
  const { vaults } = await getVaults(client);
  if (vaults.length === 0) {
    throw new Error("Claimer: No vaults found in subgraph");
  }

  const numberOfTiers = await prizePool.numberOfTiers();
  const tiersArray = Array.from({ length: numberOfTiers + 1 }, (value, index) => index);

  let transactionsPopulated: PopulatedTransaction[] | undefined = [];

  console.log(chalk.blue(`Multicall: Getting vault winners ...`));
  const infuraProvider = new ethers.providers.InfuraProvider("goerli", process.env.INFURA_API_KEY);
  const vaultWinners: VaultWinners = await getWinners(
    infuraProvider,
    contracts,
    vaults,
    tiersArray
  );

  // TODO: Don't attempt to run tx unless we know for sure it will succeed
  //
  // TODO: Make sure user has balance before adding them to the multicall
  //
  // TODO: Is profitable?
  //
  const vaultWinnerKeys = Object.keys(vaultWinners);

  const key = vaultWinnerKeys[0];
  // TODO: reinstate:
  // for (const key of vaultWinnerKeys) {

  console.log(chalk.blue(`Processing vault: '${key}'`));

  const vault = vaultWinners[key];
  const winners = vault.winners;
  const tiers = vault.tiers;

  const numWinners = winners.length;
  console.log({ numWinners });

  let minFees: BigNumber = BigNumber.from(0);
  // try {
  //   minFees = await claimer.callStatic.estimateFees(numWinners);
  //   console.log("minFees");
  //   console.log(minFees);
  //   console.log(minFees.toString());
  // } catch (e) {
  //   console.error(chalk.red(e));
  // }

  const claimPrizesParams: ClaimPrizesParams = {
    vault: key,
    winners,
    tiers,
    minFees,
    feeRecipient,
  };
  console.log(claimPrizesParams);

  const feeData = await provider.getFeeData();
  console.table(feeData);

  const ethMarketRateUsd = await getEthMarketRateUsd(contracts, marketRate);
  console.log(ethMarketRateUsd);

  let estimatedGasLimit;
  try {
    estimatedGasLimit = await claimer.estimateGas.claimPrizes(...Object.values(claimPrizesParams));
    console.log("estimatedGasLimit ? ", estimatedGasLimit);
  } catch (e) {
    console.log(chalk.red(e));
  }

  console.log(estimatedGasLimit);
  // }

  //   // const feeData = await provider.getFeeData();
  //   // console.table(feeData);

  //   const ethMarketRateUsd = await getEthMarketRateUsd(contracts, marketRate);

  //   let estimatedGasLimit;
  //   try {
  //     estimatedGasLimit = await claimer.estimateGas.claimPrizes(
  //       ...Object.values(claimPrizesParams)
  //     );
  //     console.log("estimatedGasLimit ? ", estimatedGasLimit);
  //   } catch (e) {
  //     console.table(e);
  //     console.log(chalk.red(e));
  //   }
  //   console.log(estimatedGasLimit);
  //   console.log(ethMarketRateUsd);

  //   const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
  //     estimatedGasLimit,
  //     ethMarketRateUsd,
  //     provider
  //   );

  //   printAsterisks();
  //   console.log(chalk.blue("2. Current gas costs for transaction:"));
  //   console.table({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

  //   const earnedFees = await claimer.callStatic.claimPrizes(...Object.values(claimPrizesParams));
  //   console.log("earnedFees ? ", earnedFees);

  //   const prizesToClaim = 0;

  //   if (prizesToClaim > 0) {
  //     console.log("Claimer: Start Claim Prizes");
  //     // transactionsPopulated.push(
  //     //   await claimer.populateTransaction.claimPrizes(
  //     //     vault.id,
  //     //     winners,
  //     //     tiers,
  //     //     minFees,
  //     //     feeRecipient
  //     //   )
  //     // );
  //   } else {
  //     console.log(`Claimer: No Prizes found to claim for Vault: ${vault}.`);
  //   }
  // }

  return transactionsPopulated;
}

const getGasEstimate = async (
  claimer: Contract,
  claimPrizesParams: ClaimPrizesParams
): Promise<BigNumber> => {
  return await claimer.estimateGas.claimPrizes(...Object.values(claimPrizesParams));
};
