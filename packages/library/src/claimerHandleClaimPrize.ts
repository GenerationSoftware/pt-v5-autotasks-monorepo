import { ethers, BigNumber, Contract } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";

import { ContractsBlob, ProviderOptions } from "./types";
import { getContract, getContracts } from "./utils";

const debug = require("debug")("pt-autotask-lib");

type ClaimPrizeParams = {
  vaultAddress: string;
  winners: string[];
  tiers: string[];
  minFees: string;
  feeRecipient: string;
};

export async function claimerHandleClaimPrize(
  contracts: ContractsBlob,
  config: ProviderOptions,
  feeRecipient: string
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, provider } = config;

  const claimer = getContract("Claimer", chainId, provider, contracts);
  const vaults = getContracts("Vault", chainId, provider, contracts);
  console.log(vaults);

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

    // if (!vault) {
    //   throw new Error("Vault: Contract Unavailable");
    // }
    const winners = [];
    const tiers = [];
    const minFees = "asdf";

    const params: ClaimPrizeParams = {
      vaultAddress: vault.address,
      winners,
      tiers,
      minFees,
      feeRecipient,
    };

    const feeData = await getFeeData(provider);
    console.log("feeData ? ", feeData);

    const earnedFees = await claimer.callStatic.claimPrize(params);
    console.log("earnedFees ? ", earnedFees);

    const gasEstimate = await getGasEstimate(claimer, params);
    console.log("gasEstimate ? ", gasEstimate);

    const prizesToClaim = 0;

    if (prizesToClaim > 0) {
      console.log("Claimer: Start Claim Prizes");
      transactionsPopulated.push(
        await claimer.populateTransaction.claimPrize(
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

const getGasEstimate = async (claimer: Contract, params: ClaimPrizeParams): Promise<BigNumber> => {
  let gasEstimate: BigNumber;

  gasEstimate = await claimer.estimateGas.claimPrize(params);

  return gasEstimate;
};

const getFeeData = async (
  provider: DefenderRelayProvider | DefenderRelaySigner | JsonRpcProvider
): Promise<string> => {
  const feeData = await provider.getFeeData();
  return ethers.utils.formatUnits(feeData.maxFeePerGas, "gwei");
};
