import nodeFetch from 'node-fetch';
import { ethers, BigNumber, Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import {
  ContractsBlob,
  Claim,
  PrizeVault,
  PrizePoolInfo,
  getPrizePoolInfo,
  getContract,
  getSubgraphPrizeVaults,
  flagClaimedRpc,
} from '@generationsoftware/pt-v5-utils-js';
import groupBy from 'lodash.groupby';
import chalk from 'chalk';

import {
  ClaimPrizeContext,
  PrizeClaimerConfig,
  TiersContext,
  Token,
  TokenWithRate,
} from './types.js';
import {
  getComputeTotalClaimFeesMulticall,
  getFeesUsd,
  getEthMainnetTokenMarketRateUsd,
  getNativeTokenMarketRateUsd,
  getWinnersUri,
  printDateTimeStr,
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  roundTwoDecimalPlaces,
  findRecipient,
} from './utils/index.js';
import { ERC20Abi } from './abis/ERC20Abi.js';
import { VaultAbi } from './abis/VaultAbi.js';
import { ClaimerAbi } from './abis/ClaimerAbi.js';
import { NETWORK_NATIVE_TOKEN_INFO } from './constants/network.js';
import { sendPopulatedTx } from './helpers/sendPopulatedTx.js';

type ClaimPrizesParams = {
  vault: string;
  tier: number;
  winners: string[];
  prizeIndices: number[][];
  rewardRecipient: string;
  minVrgdaFeePerClaim: string;
};

type TierRemainingPrizeCounts = {
  [tierNum: string]: number;
};

type PrizeTierIndices = Record<string, number[]>;

type Winner = {
  user: string;
  prizes: PrizeTierIndices;
};

const TOTAL_CLAIM_COUNT_PER_TRANSACTION = 30 as const; // prevent OZ bot from running over 5-minute limit and from gas being too large
const NUM_CANARY_TIERS = 2 as const;

/**
 * Finds all winners for the current draw who have unclaimed prizes and decides if it's profitable
 * to claim for them. The fees the claimer bot can earn increase exponentially over time.
 *
 * @returns {undefined} void function
 */
export async function runPrizeClaimer(
  contracts: ContractsBlob,
  config: PrizeClaimerConfig,
): Promise<undefined> {
  const { chainId, covalentApiKey, wallet, provider, subgraphUrl } = config;
  printSpacer();
  printDateTimeStr('START');
  printSpacer();

  const rewardRecipient = findRecipient(config);

  console.log(
    chalk.dim('Config - MIN_PROFIT_THRESHOLD_USD:'),
    chalk.yellow(config.minProfitThresholdUsd),
  );

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePoolContract = getContract(
    'PrizePool',
    chainId,
    provider,
    contracts,
    contractsVersion,
  );

  // #1. Get context about the prize pool prize token, etc
  printSpacer();
  console.log(chalk.dim('Starting ...'));
  const context: ClaimPrizeContext = await getContext(
    chainId,
    contracts,
    prizePoolContract,
    provider,
    covalentApiKey,
  );
  printContext(context);

  if (context.isDrawFinalized) {
    printAsterisks();
    console.log(
      chalk.yellow(
        `Draw is finalized. Cannot claim prizes anymore for finalized draw. Exiting ...`,
      ),
    );

    printSpacer();
    printDateTimeStr('END');
    printSpacer();
    return;
  }

  printAsterisks();
  console.log(chalk.dim(`Getting prize vaults ...`));
  const prizeVaults = await getSubgraphPrizeVaults(subgraphUrl);
  console.log(chalk.dim(`Found ${prizeVaults.length} prize vaults.`));
  printSpacer();

  // #2. Get data from pt-v5-winners
  let claims: Claim[] = await fetchClaims(
    chainId,
    prizePoolContract.address,
    context.drawId,
    prizeVaults,
  );

  // #3. Cross-reference prizes claimed to flag if a claim has been claimed or not
  claims = await flagClaimedRpc(provider, contracts, claims);

  let unclaimedClaims = claims.filter((claim) => !claim.claimed);
  const claimedClaims = claims.filter((claim) => claim.claimed);
  if (claimedClaims.length === 0) {
    console.log(chalk.dim(`No claimed prizes for draw #${context.drawId}.`));
  } else {
    console.log(
      chalk.dim(`${claimedClaims.length} prizes already claimed for draw #${context.drawId}.`),
    );
  }
  console.log(chalk.dim(`${unclaimedClaims.length} prizes remaining to be claimed...`));

  if (unclaimedClaims.length === 0) {
    printAsterisks();
    console.log(chalk.yellow(`No prizes left to claim. Exiting ...`));
    printSpacer();
    printDateTimeStr('END');
    printSpacer();
    return;
  }

  // #4. Sort unclaimed claims by tier so largest prizes (with the largest rewards) are first
  unclaimedClaims = unclaimedClaims.sort((a, b) => a.tier - b.tier);

  // #5. Group claims by vault & tier
  const unclaimedClaimsGrouped = groupBy(unclaimedClaims, (item) => [item.vault, item.tier]);

  // Keep track of how many prizes we can claim per tier

  let tierRemainingPrizeCounts: TierRemainingPrizeCounts = {};
  let canaryTierNotProfitable = false;
  for (let vaultTier of Object.entries(unclaimedClaimsGrouped)) {
    const [key, value] = vaultTier;
    const [vault, tier] = key.split(',');
    const groupedClaims: any = value;

    printSpacer();
    printSpacer();
    printSpacer();
    printAsterisks();

    console.log(`Processing:`);
    console.log(chalk.blueBright(`Vault:     ${vault}`));
    console.log(chalk.blueBright(`Tier:      #${tierWords(context, Number(tier))}`));
    console.log(chalk.blueBright(`# prizes:  ${groupedClaims.length}`));

    const reserve = await prizePoolContract.reserve();
    const { enoughLiquidity } = getLiquidityInfo(context, tier, tierRemainingPrizeCounts, reserve);
    if (!enoughLiquidity) {
      printSpacer();
      console.log(
        chalk.redBright(
          `Tier #${tierWords(context, Number(tier))} insufficient liquidity, skipping ...`,
        ),
      );
      printSpacer();
      continue;
    }

    if (isCanary(context, Number(tier)) && canaryTierNotProfitable) {
      printSpacer();
      console.log(
        chalk.redBright(`Tier #${tierWords(context, Number(tier))} not profitable, skipping ...`),
      );
      printSpacer();
      continue;
    }

    // #5. Dynamically find the claimer for this vault
    const claimerContract: Contract = await getClaimerContract(vault, provider);

    // #6. Decide if profitable or not
    printSpacer();
    console.log(chalk.blue(`5a. Calculating # of profitable claims ...`));

    const claimPrizesParams = await calculateProfit(
      provider,
      vault,
      Number(tier),
      claimerContract,
      groupedClaims,
      tierRemainingPrizeCounts,
      context,
      config,
      rewardRecipient,
    );

    // It's profitable if there is at least 1 claim to claim
    // #7. Populate transaction
    if (claimPrizesParams.winners.length > 0) {
      printSpacer();
      console.log(
        chalk.green(`Execute Claim Transaction for Tier #${tierWords(context, Number(tier))}`),
      );
      printSpacer();

      const populatedTx = await claimerContract.populateTransaction.claimPrizes(
        ...Object.values(claimPrizesParams),
      );

      const gasLimit = 20000000;
      const tx = await sendPopulatedTx(provider, wallet, populatedTx, gasLimit);

      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

      console.log('Waiting on transaction to be confirmed ...');
      await provider.waitForTransaction(tx.hash);
      console.log('Tx confirmed !');
    } else {
      console.log(
        chalk.yellow(
          `Not profitable to claim for Draw #${context.drawId}, Tier: #${tierWords(
            context,
            Number(tier),
          )}`,
        ),
      );

      if (isCanary(context, Number(tier))) {
        canaryTierNotProfitable = true;
      } else {
        console.log(
          chalk.redBright(`Not profitable to claim any more tiers yet for Draw #${context.drawId}`),
        );

        break;
      }
    }
  }

  printSpacer();
  printDateTimeStr('END');
  printSpacer();
}

const isCanary = (context: ClaimPrizeContext, tier: number): boolean => {
  const tiersLength = context.tiers.tiersRangeArray.length;
  return tier >= tiersLength - NUM_CANARY_TIERS;
};

/**
 * Figures out how much gas is required to run the contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getEstimatedGasLimit = async (
  claimerContract: Contract,
  claimPrizesParams: ClaimPrizesParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await claimerContract.estimateGas.claimPrizes(
      ...Object.values(claimPrizesParams),
    );
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
  provider: Provider,
  vault: string,
  tier: number,
  claimerContract: Contract,
  groupedClaims: any,
  tierRemainingPrizeCounts: TierRemainingPrizeCounts,
  context: ClaimPrizeContext,
  config: PrizeClaimerConfig,
  rewardRecipient: string,
): Promise<ClaimPrizesParams> => {
  const { chainId, covalentApiKey, minProfitThresholdUsd } = config;

  printSpacer();
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId, covalentApiKey);
  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${nativeTokenMarketRateUsd}`,
  );
  printSpacer();

  const gasCost = await getGasCost(
    provider,
    chainId,
    vault,
    tier,
    claimerContract,
    groupedClaims,
    rewardRecipient,
    nativeTokenMarketRateUsd,
    '100',
  );

  const { claimCount, claimRewardUsd, totalCostUsd, minVrgdaFeePerClaim } = await getClaimInfo(
    context,
    provider,
    claimerContract,
    tier,
    groupedClaims,
    tierRemainingPrizeCounts,
    gasCost,
    minProfitThresholdUsd,
  );

  const claimsSlice = groupedClaims.slice(0, claimCount);
  const claimPrizesParams = buildParams(
    vault,
    tier,
    claimsSlice,
    rewardRecipient,
    minVrgdaFeePerClaim,
  );

  printAsterisks();
  console.log(chalk.magenta('5c. Profit/Loss (USD):'));
  printSpacer();

  // FEES USD
  const netProfitUsd = claimRewardUsd - totalCostUsd;
  console.log(chalk.magenta('Net profit = (Gross Profit - Gas Cost [Average])'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        claimRewardUsd,
      )} - $${roundTwoDecimalPlaces(totalCostUsd)})`,
    ),
    chalk.dim(`$${netProfitUsd} = ($${claimRewardUsd} - $${totalCostUsd})`),
  );
  printSpacer();

  const profitable = claimCount >= 1;

  if (profitable) {
    console.log(chalk.yellow(`Submitting transaction to claim ${claimCount} prize(s):`));
    logClaims(claimsSlice);
  } else {
    console.log(
      chalk.yellow(`Claiming tier #${tierWords(context, tier)} currently not profitable.`),
    );
  }

  return claimPrizesParams;
};

const tierWords = (context: ClaimPrizeContext, tier: number) => {
  const canaryWords = isCanary(context, tier) ? ' (Canary tier)' : '';

  return `${tier}${canaryWords}`;
};

const logClaims = (claims: Claim[]) => {
  printSpacer();
  claims.forEach((claim) =>
    console.log(`${claim.vault}-${claim.winner}-${claim.tier}-${claim.prizeIndex}`),
  );
  printSpacer();
  printSpacer();
};

/**
 * Gather information about the given prize pool's reward token price in USD
 * and the last drawId
 * @returns {Promise} Promise of a ClaimPrizeContext object
 */
const getContext = async (
  chainId: number,
  contracts: ContractsBlob,
  prizePool: Contract,
  provider: Provider,
  covalentApiKey: string,
): Promise<ClaimPrizeContext> => {
  const prizeTokenAddress = await prizePool.prizeToken();

  console.log(chalk.dim('Getting prize pool info ...'));

  const prizePoolInfo: PrizePoolInfo = await getPrizePoolInfo(provider, contracts);
  const { drawId, isDrawFinalized, numTiers, tiersRangeArray, tierPrizeData } = prizePoolInfo;
  const tiers: TiersContext = { numTiers, tiersRangeArray };

  const prizeTokenContract = new ethers.Contract(prizeTokenAddress, ERC20Abi, provider);

  console.log(chalk.dim('Getting prize context ...'));

  const prizeTokenBasic: Token = {
    address: prizeTokenAddress,
    decimals: await prizeTokenContract.decimals(),
    name: await prizeTokenContract.name(),
    symbol: await prizeTokenContract.symbol(),
  };

  const prizeToken: TokenWithRate = {
    ...prizeTokenBasic,
    assetRateUsd: await getEthMainnetTokenMarketRateUsd(
      chainId,
      covalentApiKey,
      prizeTokenBasic.symbol,
      prizeTokenBasic.address,
    ),
  };

  return { prizeToken, drawId, isDrawFinalized, tiers, tierPrizeData };
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = (context) => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Prize token: ${context.prizeToken.symbol}`));
  printSpacer();

  logTable({ prizeToken: context.prizeToken });
  logTable({ tiers: context.tiers });
  logStringValue('Draw ID:', context.drawId);
  logStringValue(
    `Prize Token ${context.prizeToken.symbol} MarketRate USD: `,
    `$${context.prizeToken.assetRateUsd}`,
  );
};

const buildParams = (
  vault: string,
  tier: number,
  claims: Claim[],
  rewardRecipient: string,
  minVrgdaFeePerClaim: string,
): ClaimPrizesParams => {
  let winners: string[] = [];
  let prizeIndices: number[][] = [];

  claims.forEach((claim) => {
    winners.push(claim.winner);
    // TODO: Can submit multiple prizes for 1 user address here:
    // ie. vault, tier, winner, [prize 1, prize 2]
    prizeIndices.push([claim.prizeIndex]);
  });

  return {
    vault,
    tier,
    winners,
    prizeIndices,
    rewardRecipient,
    minVrgdaFeePerClaim,
  };
};

const getGasCost = async (
  provider: Provider,
  chainId: number,
  vault: string,
  tier: number,
  claimerContract: Contract,
  claims: Claim[],
  rewardRecipient: string,
  gasTokenMarketRateUsd: number,
  estimateMinVrgdaFeePerClaim: string,
) => {
  let claimsSlice = claims.slice(0, 1);
  let claimPrizesParams = buildParams(
    vault,
    tier,
    claimsSlice,
    rewardRecipient,
    estimateMinVrgdaFeePerClaim,
  );

  const gasPrice = await provider.getGasPrice();
  logBigNumber(
    'Recent Gas Price (wei):',
    gasPrice,
    NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );
  logStringValue('Recent Gas Price (gwei):', `${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
  printSpacer();

  let estimatedGasLimitForOne = await getEstimatedGasLimit(claimerContract, claimPrizesParams);
  if (!estimatedGasLimitForOne || estimatedGasLimitForOne.eq(0)) {
    console.error(chalk.yellow('Estimated gas limit is 0 ...'));
  } else {
    logBigNumber(
      'Estimated gas limit (wei) (1 prize claim):',
      estimatedGasLimitForOne,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
    );
  }

  let populatedTx = await claimerContract.populateTransaction.claimPrizes(
    ...Object.values(claimPrizesParams),
  );
  const { avgFeeUsd: gasCostOneClaimUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimitForOne,
    gasTokenMarketRateUsd,
    provider,
    populatedTx.data,
  );

  // 2. Gas cost for 2 claims:
  let estimatedGasLimitForTwo;
  if (claims.length > 1) {
    claimsSlice = claims.slice(0, 2);
    claimPrizesParams = buildParams(
      vault,
      tier,
      claimsSlice,
      rewardRecipient,
      estimateMinVrgdaFeePerClaim,
    );

    estimatedGasLimitForTwo = await getEstimatedGasLimit(claimerContract, claimPrizesParams);
    if (!estimatedGasLimitForTwo || estimatedGasLimitForTwo.eq(0)) {
      console.error(chalk.yellow('Estimated gas limit is 0 ...'));
    } else {
      logBigNumber(
        'Estimated gas limit (wei) (2 prize claims):',
        estimatedGasLimitForTwo,
        NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
        NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
      );
    }
  }

  // 3. Calculate how much for the initial tx and for subsequent tx's
  printSpacer();

  const gasCostEachFollowingClaim =
    claims.length > 1 && estimatedGasLimitForTwo
      ? estimatedGasLimitForTwo.sub(estimatedGasLimitForOne)
      : estimatedGasLimitForOne;
  logBigNumber(
    'Gas Cost: First Claim (wei):',
    estimatedGasLimitForOne,
    NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );

  if (claims.length > 1) {
    logBigNumber(
      'Gas Cost: Each Following Claim (wei):',
      gasCostEachFollowingClaim,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
    );
  }

  // 4. Convert gas costs to USD
  printSpacer();
  populatedTx = await claimerContract.populateTransaction.claimPrizes(
    ...Object.values(claimPrizesParams),
  );
  const { avgFeeUsd: gasCostEachFollowingClaimUsd } = await getFeesUsd(
    chainId,
    gasCostEachFollowingClaim,
    gasTokenMarketRateUsd,
    provider,
    populatedTx.data,
  );
  console.log(
    chalk.grey(`Gas Cost: First Claim (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(gasCostOneClaimUsd)}`),
    chalk.dim(`$${gasCostOneClaimUsd}`),
  );
  if (claims.length > 1) {
    console.log(
      chalk.grey(`Gas Cost: Each Following Claim (USD):`),
      chalk.yellow(`$${roundTwoDecimalPlaces(gasCostEachFollowingClaimUsd)}`),
      chalk.dim(`$${gasCostEachFollowingClaimUsd}`),
    );
  }

  return {
    gasCostOneClaimUsd,
    gasCostEachFollowingClaimUsd,
  };
};

interface ClaimInfo {
  claimCount: number;
  claimRewardUsd: number;
  totalCostUsd: number;
  minVrgdaFeePerClaim: string;
}

const getClaimInfo = async (
  context: ClaimPrizeContext,
  provider: Provider,
  claimerContract: Contract,
  tier: number,
  claims: Claim[],
  tierRemainingPrizeCounts: TierRemainingPrizeCounts,
  gasCost: any,
  minProfitThresholdUsd: number,
): Promise<ClaimInfo> => {
  let claimCount = 0;
  let claimReward = BigNumber.from(0);
  let claimRewardUsd = 0;
  let totalCostUsd = 0;
  let previousNetProfitUsd = 0;
  let minVrgdaFeePerClaim = BigNumber.from(0);

  printSpacer();

  const computeTotalClaimFeesResults = await getComputeTotalClaimFeesMulticall(
    tier,
    claims.length,
    claimerContract,
    provider,
  );

  for (let numClaims = 1; numClaims <= claims.length; numClaims++) {
    printSpacer();
    console.log(chalk.cyanBright(`5b. ${numClaims} Claim(s):`));

    // If there's only liquidity for say 4 prizes and our target
    // claim count is 10 we'll stop the loop at 4
    if (tierRemainingPrizeCounts[tier.toString()] === 0) {
      printSpacer();
      console.log(
        chalk.redBright(
          `Tier #${tierWords(context, Number(tier))} insufficient liquidity, exiting tier ...`,
        ),
      );
      printSpacer();
      break;
    }

    const nextClaimReward = computeTotalClaimFeesResults[numClaims.toString()];

    // COSTS USD
    totalCostUsd =
      numClaims === 1
        ? gasCost.gasCostOneClaimUsd
        : gasCost.gasCostOneClaimUsd + gasCost.gasCostEachFollowingClaimUsd * (numClaims - 1);

    printSpacer();

    console.log(
      chalk.green(
        `Total gas cost: ${numClaims} Claim(s) (USD):`,
        `$${roundTwoDecimalPlaces(totalCostUsd)}`,
      ),
      chalk.dim(`($${totalCostUsd})`),
    );
    printSpacer();

    if (claimCount !== 0) {
      claimRewardUsd =
        parseFloat(ethers.utils.formatUnits(claimReward.toString(), context.prizeToken.decimals)) *
        context.prizeToken.assetRateUsd;
      logBigNumber(
        `Claim Reward: ${claimCount} Claim(s) (WEI):`,
        claimReward,
        context.prizeToken.decimals,
        context.prizeToken.symbol,
      );
      console.log(
        chalk.green(
          `Claim Reward: ${claimCount} Claim(s) (USD):`,
          `$${roundTwoDecimalPlaces(claimRewardUsd)}`,
        ),
        chalk.dim(`($${claimRewardUsd})`),
      );
      printSpacer();
    }

    const nextClaimRewardUsd =
      parseFloat(
        ethers.utils.formatUnits(nextClaimReward.toString(), context.prizeToken.decimals),
      ) * context.prizeToken.assetRateUsd;
    logBigNumber(
      `Next Claim Reward: ${numClaims} Claim(s) (WEI):`,
      nextClaimReward,
      context.prizeToken.decimals,
      context.prizeToken.symbol,
    );
    console.log(
      chalk.green(
        `Next Claim Reward: ${numClaims} Claim(s) (USD):`,
        `$${roundTwoDecimalPlaces(nextClaimRewardUsd)}`,
      ),
      chalk.dim(`($${nextClaimRewardUsd})`),
    );
    printSpacer();

    const netProfitUsd = nextClaimRewardUsd - totalCostUsd;

    console.log(chalk.dim('Net profit = (Gross Profit - Gas Cost [Average])'));
    console.log(
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
          nextClaimRewardUsd,
        )} - $${roundTwoDecimalPlaces(totalCostUsd)})`,
      ),
      chalk.dim(`$${netProfitUsd} = ($${nextClaimRewardUsd} - $${totalCostUsd})`),
    );

    claimRewardUsd = nextClaimRewardUsd;

    if (
      netProfitUsd > previousNetProfitUsd &&
      netProfitUsd > minProfitThresholdUsd &&
      numClaims < TOTAL_CLAIM_COUNT_PER_TRANSACTION
    ) {
      tierRemainingPrizeCounts[tier.toString()]--;

      const claimRewardUnpacked = claimReward[0] ? claimReward[0] : claimReward;
      minVrgdaFeePerClaim = nextClaimReward[0].sub(claimRewardUnpacked);

      previousNetProfitUsd = netProfitUsd;
      claimCount = numClaims;
      claimReward = nextClaimReward;

      printSpacer();
    } else {
      break;
    }
  }

  return {
    claimCount,
    claimRewardUsd,
    totalCostUsd,
    minVrgdaFeePerClaim: minVrgdaFeePerClaim.toString(),
  };
};

const fetchClaims = async (
  chainId: number,
  prizePoolAddress: string,
  drawId: number,
  prizeVaults: PrizeVault[],
): Promise<Claim[]> => {
  let claims: Claim[] = [];

  for (let prizeVault of prizeVaults) {
    const winnersUri = getWinnersUri(chainId, prizePoolAddress, drawId, prizeVault.id);

    let winners: Winner[] = [];
    try {
      const response = await nodeFetch(winnersUri);
      if (!response.ok) {
        printSpacer();
        console.log(
          chalk.yellow(
            `Could not find winners for prize vault: ${prizeVault.id} (results not yet computed for new draw with id #${drawId}?)`,
          ),
        );
        console.log(chalk.dim(winnersUri));
        printSpacer();
        throw new Error(response.statusText);
      }

      // @ts-ignore
      winners = (await response.json()).winners;

      for (let winner of winners) {
        for (let prizeTier of Object.entries(winner.prizes)) {
          const [tier, prizeIndices] = prizeTier;

          for (let prizeIndex of prizeIndices)
            claims.push({
              vault: prizeVault.id,
              winner: winner.user,
              tier: Number(tier),
              prizeIndex,
              claimed: false,
            });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  return claims;
};

// Find out max # of prizes claimable based on remaining liquidity and PrizePool reserve
const getLiquidityInfo = (
  context: ClaimPrizeContext,
  tier: string,
  tierRemainingPrizeCounts: TierRemainingPrizeCounts,
  reserve: BigNumber,
) => {
  const tierPrizeInfo = context.tierPrizeData[tier];

  const liquidity = BigNumber.from(tierPrizeInfo.liquidity);
  const liquiditySummed = reserve.add(liquidity);

  const maxPrizesForRemainingLiquidity = Number(liquiditySummed.div(tierPrizeInfo.amount));

  if (!tierRemainingPrizeCounts[tier]) {
    tierRemainingPrizeCounts[tier] = maxPrizesForRemainingLiquidity;
  }
  const enoughLiquidity = maxPrizesForRemainingLiquidity > 0;

  return { enoughLiquidity };
};

const getClaimerContract = async (vaultAddress: string, provider: Provider): Promise<Contract> => {
  const vaultContract = new ethers.Contract(vaultAddress, VaultAbi, provider);
  const claimerAddress = await vaultContract.claimer();

  if (!claimerAddress) {
    throw new Error('Contract Unavailable');
  }

  return new Contract(claimerAddress, ClaimerAbi, provider);
};
