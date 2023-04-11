import { ethers, BigNumber, Contract } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import chalk from "chalk";

import { ContractsBlob, ProviderOptions, Vault, VaultAccount } from "./types";
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
  vaultAddress: string;
  winners: string[];
  tiers: number[];
  minFees: BigNumber;
  feeRecipient: string;
}

interface Winner {
  vault: string;
  user: string;
  tier: number;
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

  const client = getTwabControllerSubgraphClient(chainId);
  const { vaults } = await getVaults(client);
  if (vaults.length === 0) {
    throw new Error("Claimer: No vaults found in subgraph");
  }

  const numberOfTiers = await prizePool.numberOfTiers();
  const tiersArray = Array.from({ length: numberOfTiers + 1 }, (value, index) => index);

  let transactionsPopulated: PopulatedTransaction[] | undefined = [];

  // Execute batched calls
  const infuraProvider = new ethers.providers.InfuraProvider("goerli", process.env.INFURA_API_KEY);
  const vaultWinners: string[] = await getWinners(infuraProvider, contracts, vaults, tiersArray);
  console.log({ vaultWinners });

  Object.keys(vaultWinners).forEach((vault) => {
    console.log(vault);
  });

  // for (let i = 0; i < vaults.length; i++) {
  //   console.log(`Vault #${i + 1}`);
  //   const vault: Vault = vaults[i];
  //   const accounts = vault.accounts;
  //   console.log(`${accounts.length + 1} accounts`);
  //   console.log("");

  //   console.log("Determining winners:");
  //   for (let x = 0; x < accounts.length; x++) {
  //     const account: VaultAccount = accounts[x];
  //     // console.log(`VaultAccount #${x + 1}`);
  //     const address = account.id.split("-")[1];
  //     // console.log(address);

  //     for (let y = 0; y < tiersArray.length; y++) {
  //       const tier = tiersArray[y];
  //       // const isWinner = await prizePool.isWinner(vault.id, address, tier);
  //       process.stdout.write(".");
  //       console.log(tier);
  //       console.log(address);
  //       batchCalls.push(etherplexPrizePoolContract.isWinner(vault.id, address, tier));

  //       // if (isWinner) {
  //       //   console.log(isWinner);
  //       //   const winner = {
  //       //     vault: vault.id,
  //       //     user: address,
  //       //     tier,
  //       //   };
  //       //   winners.push(winner);
  //       // }
  //     }
  //   }

  //   // const winners = [];
  //   // const tiers = [];
  // }

  // console.log(batchCalls);
  // values = await batch(infuraProvider, ...batchCalls);
  // console.log(values);
  // console.log(batchCalls.length);

  // const minFees = BigNumber.from(0);
  // // TODO: Iterate based on tier
  // for (let p = 0; p < winners.length; p++) {
  //   const winner = winners[p];
  //   console.log(winner);
  //   const vault = winner.vault;

  //   const claimPrizesParams: ClaimPrizesParams = {
  //     vaultAddress: vault,
  //     winners: winners.map((winner) => winner.user),
  //     tiers: winners.map((winner) => winner.tier),
  //     minFees,
  //     feeRecipient,
  //   };

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
