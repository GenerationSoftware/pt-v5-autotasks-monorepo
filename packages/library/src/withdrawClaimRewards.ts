import { ethers, Contract, BigNumber } from "ethers";
import { PopulatedTransaction } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/providers";
import { getContract } from "@pooltogether/v5-utils-js";
import chalk from "chalk";

import {
  ContractsBlob,
  WithdrawClaimRewardsConfigParams,
  WithdrawClaimRewardsContext
} from "./types";
import { logTable, logBigNumber, printAsterisks, printSpacer } from "./utils";
import { ERC20Abi } from "./abis/ERC20Abi";

interface WithdrawClaimRewardsParams {
  amount: BigNumber;
  rewardsRecipient: string;
}

/**
 * Creates a populated transaction object for a prize claimer to withdraw their claim rewards.
 *
 * @returns {(Promise|undefined)} Promise of an ethers PopulatedTransaction or undefined
 */
export async function getWithdrawClaimRewardsTx(
  contracts: ContractsBlob,
  readProvider: Provider,
  params: WithdrawClaimRewardsConfigParams
): Promise<PopulatedTransaction | undefined> {
  const { chainId, rewardsRecipient, relayerAddress } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0
  };
  const prizePool = getContract("PrizePool", chainId, readProvider, contracts, contractsVersion);

  if (!prizePool) {
    throw new Error("WithdrawRewards: PrizePool Contract Unavailable");
  }

  // #1. Get context about the prize pool prize token, etc
  const context: WithdrawClaimRewardsContext = await getContext(prizePool, readProvider);
  printContext(context);

  // #2. Get data about how much rewards a prize claimer can withdraw
  printSpacer();
  console.log(chalk.blue(`2. Getting claim rewards balance for '${relayerAddress}' ...`));
  const amount = await prizePool.balanceOfClaimRewards(relayerAddress);

  logBigNumber(
    `${context.rewardsToken.symbol} balance:`,
    amount,
    context.rewardsToken.decimals,
    context.rewardsToken.symbol
  );

  printAsterisks();
  console.log(chalk.blue(`3. Creating transaction ...`));

  const withdrawClaimRewardsParams: WithdrawClaimRewardsParams = {
    rewardsRecipient,
    amount
  };

  console.log(chalk.green("Claimer: Add Populated Claim Tx"));
  const populatedTx: PopulatedTransaction = await prizePool.populateTransaction.withdrawClaimRewards(
    ...Object.values(withdrawClaimRewardsParams)
  );

  return populatedTx;
}

/**
 * Gather information about the given prize pool's fee token, fee token price in USD
 * and the last drawId
 * @returns {Promise} Promise of a WithdrawClaimRewardsContext object
 */
const getContext = async (
  prizePool: Contract,
  readProvider: Provider
): Promise<WithdrawClaimRewardsContext> => {
  const rewardsTokenAddress = await prizePool.prizeToken();

  const tokenInContract = new ethers.Contract(rewardsTokenAddress, ERC20Abi, readProvider);

  const rewardsToken = {
    address: rewardsTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol()
  };

  // const rewardsTokenRateUsd = await getRewardsTokenRateUsd(marketRate, rewardsToken);

  return { rewardsToken };
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = context => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Rewards/prize token: ${context.rewardsToken.symbol}`));
  printSpacer();

  logTable({ rewardsToken: context.rewardsToken });
  // logStringValue(
  //   `Rewards Token ${context.rewardsToken.symbol} MarketRate USD: `,
  //   `$${context.rewardsTokenRateUsd}`
  // );
};
