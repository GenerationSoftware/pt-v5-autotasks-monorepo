import { ethers, BigNumber, Contract } from "ethers";
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
} from "./utils";

type ClaimPrizesParams = {
  vaultAddress: string;
  winners: string[];
  tiers: string[];
  minFees: BigNumber;
  feeRecipient: string;
};

export async function claimerHandleClaimPrize(
  contracts: ContractsBlob,
  feeRecipient: string,
  config: ProviderOptions
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, provider } = config;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const claimer = getContract("Claimer", chainId, provider, contracts, contractsVersion);
  const vaults = getContracts("Vault", chainId, provider, contracts, contractsVersion);
  const marketRate = getContract("MarketRate", chainId, provider, contracts, contractsVersion);

  if (!claimer) {
    throw new Error("Claimer: Contract Unavailable");
  }

  if (vaults.length === 0) {
    throw new Error("Claimer: No Vault contracts found");
  }

  let transactionsPopulated: PopulatedTransaction[] | undefined = [];
  for (let i = 0; i < vaults.length; i++) {
    const vault = vaults[i];

    // const beaconPeriodEndAt = await claimer.beaconPeriodEndAt();

    // Debug Contract Request Parameters
    // debug('Claimer next Draw.drawId:', nextDrawId);

    if (!vault) {
      throw new Error("Vault: Contract Unavailable");
    }

    const winners = [];
    const tiers = [];
    const minFees = BigNumber.from(0);

    const claimPrizesParams: ClaimPrizesParams = {
      vaultAddress: vault.address,
      winners,
      tiers,
      minFees,
      feeRecipient,
    };

    // const feeData = await provider.getFeeData();
    // console.table(feeData);

    const ethMarketRateUsd = await getEthMarketRateUsd(contracts, marketRate);

    let estimatedGasLimit;
    try {
      estimatedGasLimit = await claimer.estimateGas.claimPrizes(
        ...Object.values(claimPrizesParams)
      );
      console.log("estimatedGasLimit ? ", estimatedGasLimit);
    } catch (e) {
      console.table(e);
      console.log(chalk.red(e));
    }
    console.log(estimatedGasLimit);
    console.log(ethMarketRateUsd);

    const { baseFeeUsd, maxFeeUsd, avgFeeUsd } = await getFeesUsd(
      estimatedGasLimit,
      ethMarketRateUsd,
      provider
    );

    printAsterisks();
    console.log(chalk.blue("2. Current gas costs for transaction:"));
    console.table({ baseFeeUsd, maxFeeUsd, avgFeeUsd });

    const earnedFees = await claimer.callStatic.claimPrizes(...Object.values(claimPrizesParams));
    console.log("earnedFees ? ", earnedFees);

    const prizesToClaim = 0;

    if (prizesToClaim > 0) {
      console.log("Claimer: Start Claim Prizes");
      transactionsPopulated.push(
        await claimer.populateTransaction.claimPrizes(
          vault.address,
          winners,
          tiers,
          minFees,
          feeRecipient
        )
      );
    } else {
      console.log(`Claimer: No Prizes found to claim for Vault: ${vault.address}.`);
    }
  }

  return transactionsPopulated;
}

const getGasEstimate = async (
  claimer: Contract,
  claimPrizesParams: ClaimPrizesParams
): Promise<BigNumber> => {
  return await claimer.estimateGas.claimPrizes(...Object.values(claimPrizesParams));
};
