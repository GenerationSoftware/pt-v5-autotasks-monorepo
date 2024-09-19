import nodeFetch from 'node-fetch';
import debug from 'debug';
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
  PrizeClaimerContext,
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
import { CHAIN_IDS, NETWORK_NATIVE_TOKEN_INFO } from './constants/network.js';
import { sendPopulatedTx } from './helpers/sendPopulatedTx.js';

const debugClaimer = debug('claimer');

type ClaimPrizesParams = {
  vault: string;
  tier: number;
  winners: string[];
  prizeIndices: number[][];
  rewardRecipient: string;
  minVrgdaFeePerClaim: string;
};

type ClassicClaimPrizesParams = {
  tier: number;
  winners: string[];
  prizeIndices: number[][];
  rewardRecipient: string;
  minReward: BigNumber;
};

type TierRemainingPrizeCounts = {
  [tierNum: string]: number;
};

type PrizeTierIndices = Record<string, number[]>;

type Winner = {
  user: string;
  prizes: PrizeTierIndices;
};

const PT_CLASSIC_PRIZE_VAULT_ADDRESS = '0xaf2b22b7155da01230d72289dcecb7c41a5a4bd8';

const GP_BOOSTER_CONTRACT_ADDRESSES = {
  [CHAIN_IDS.mainnet]: '0x6be9c23aa3c2cfeff92d884e20d1ec9e134ab076',
  [CHAIN_IDS.optimism]: '0xdeef914a2ee2f2014ce401dcb4e13f6540d20ba7',
  [CHAIN_IDS.gnosis]: '0x65f3aea2594d82024b7ee98ddcf08f991ab1c626',
  [CHAIN_IDS.base]: '0x327b2ea9668a552fe5dec8e3c6e47e540a0a58c6',
  [CHAIN_IDS.arbitrum]: '0x1dcfb8b47c2f05ce86c21580c167485de1202e12',
  [CHAIN_IDS.scroll]: '0x2d3ad415198d7156e8c112a508b8306699f6e4cc',
};

const TOTAL_CLAIM_COUNT_PER_TRANSACTION = 30 as const; // prevent gas from becoming too large
const NUM_CANARY_TIERS = 2 as const;
const GAS_LIMIT = 20_000_000 as const;

// Scroll and Gnosis seem to have much smaller gas limits than Ethereum, Arbitrum, Optimism and Base
const LOWER_GAS_LIMIT_CHAINS = [
  CHAIN_IDS.scrollSepolia,
  CHAIN_IDS.scroll,
  CHAIN_IDS.gnosisChiado,
  CHAIN_IDS.gnosis,
] as const;
const LOWER_GAS_LIMIT = 10_000_000 as const;
const LOWER_TOTAL_CLAIM_COUNT_PER_TRANSACTION = 15 as const;

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
  const { chainId, covalentApiKey, provider, subgraphUrl } = config;
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

  // Get context about the prize pool prize token, etc
  printSpacer();
  console.log(chalk.dim('Starting ...'));
  const context: PrizeClaimerContext = await getContext(
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

  // Get data from pt-v5-winners
  printSpacer();
  console.log(chalk.dim(`Fetching potential claims ...`));
  printSpacer();

  let claims: Claim[] = await fetchClaims(
    chainId,
    prizePoolContract.address,
    context.drawId,
    prizeVaults,
  );

  // Cross-reference prizes claimed to flag if a claim has been claimed or not
  claims = await flagClaimedRpc(provider, contracts, claims);

  let unclaimedClaims = claims.filter((claim) => !claim.claimed);
  const claimedClaims = claims.filter((claim) => claim.claimed);

  // Filter out any claims where the winner is a GPBoostHook contract and that prize is a grand prize
  unclaimedClaims = unclaimedClaims.filter(noGpBoosterGrandPrizeWinners);

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

  // Group claims by vault & tier
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

    // Dynamically find the claimer for this vault
    const claimerContract: Contract = await getClaimerContract(vault, provider);

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

    if (vaultIsPtClassic(vault)) {
      console.log(chalk.redBright('Will process'));
      console.log(chalk.blueBright('PT Classic'));
      console.log(chalk.greenBright('vault differently'));

      processClassicVault(
        vault,
        claimerContract,
        Number(tier),
        groupedClaims,
        rewardRecipient,
        context,
        config,
      );
    } else {
      if (isCanary(context, Number(tier)) && canaryTierNotProfitable) {
        printSpacer();
        console.log(
          chalk.redBright(`Tier #${tierWords(context, Number(tier))} not profitable, skipping ...`),
        );
        printSpacer();
        continue;
      }

      // Decide if profitable or not
      // TODO: This is conflated, would be nice to split up the profitability calcs from the grouping of winners
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

      // It's profitable if there is at least 1 win to claim
      if (claimPrizesParams.winners.length > 0) {
        await processNormalVault(Number(tier), claimerContract, context, config, claimPrizesParams);
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
            chalk.redBright(
              `Not profitable to claim any more tiers yet for Draw #${context.drawId}`,
            ),
          );

          break;
        }
      }
    }
  }

  printSpacer();
  printDateTimeStr('END');
  printSpacer();
}

const sendClaimTransaction = async (
  claimerContract: Contract,
  params: ClaimPrizesParams | ClassicClaimPrizesParams,
  gasLimit: number,
  config: PrizeClaimerConfig,
): Promise<void> => {
  const { provider, wallet } = config;
  const populatedTx = await claimerContract.populateTransaction.claimPrizes(
    ...Object.values(params),
  );
  const tx = await sendPopulatedTx(provider, wallet, populatedTx, gasLimit);

  console.log(chalk.greenBright.bold('Transaction sent! ✔'));
  console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

  console.log(chalk.dim('Waiting on transaction to be confirmed ...'));
  await provider.waitForTransaction(tx.hash);
  console.log(chalk.dim('Transaction confirmed !'));
};

const vaultIsPtClassic = (vaultAddress: string) =>
  vaultAddress.toLowerCase() === PT_CLASSIC_PRIZE_VAULT_ADDRESS.toLowerCase();

const processNormalVault = async (
  tier: number,
  claimerContract: Contract,
  context: PrizeClaimerContext,
  config: PrizeClaimerConfig,
  claimPrizesParams: ClaimPrizesParams,
) => {
  const { chainId } = config;

  const countPerTx = LOWER_GAS_LIMIT_CHAINS.includes(chainId)
    ? LOWER_TOTAL_CLAIM_COUNT_PER_TRANSACTION
    : TOTAL_CLAIM_COUNT_PER_TRANSACTION;

  for (let n = 0; n <= claimPrizesParams.winners.length; n += countPerTx) {
    const start = n;
    const end = n + countPerTx;

    const paramsClone = structuredClone(claimPrizesParams);
    paramsClone.winners = paramsClone.winners.slice(start, end);
    paramsClone.prizeIndices = paramsClone.prizeIndices.slice(start, end);
    logClaims(paramsClone);

    printSpacer();
    printSpacer();
    console.log(
      chalk.green(
        `Execute Claim Transaction for Tier #${tierWords(context, tier)}, claims ${
          start + 1
        } to ${Math.min(end, claimPrizesParams.winners.length)} `,
      ),
    );

    const rewards = await getRewards(claimerContract, paramsClone);
    if (rewards.gt(0)) {
      const gasLimit = LOWER_GAS_LIMIT_CHAINS.includes(chainId) ? LOWER_GAS_LIMIT : GAS_LIMIT;

      await sendClaimTransaction(claimerContract, paramsClone, gasLimit, config);
    } else {
      console.log(chalk.yellowBright.bold('Skipping transaction as rewards from simulation are 0'));
    }
  }
};

const processClassicVault = async (
  vault: string,
  claimerContract: Contract,
  tier: number,
  groupedClaims: Claim[],
  rewardRecipient: string,
  context: PrizeClaimerContext,
  config: PrizeClaimerConfig,
) => {
  const params = buildParams(vault, Number(tier), groupedClaims, rewardRecipient, '100');
  const classicParams: ClassicClaimPrizesParams = {
    winners: params.winners,
    tier: params.tier,
    prizeIndices: params.prizeIndices,
    rewardRecipient: params.rewardRecipient,
    minReward: BigNumber.from(0),
  };
  console.log('classicParams');
  console.log(classicParams);

  for (let n = 0; n <= classicParams.winners.length; n += TOTAL_CLAIM_COUNT_PER_TRANSACTION) {
    const start = n;
    const end = n + TOTAL_CLAIM_COUNT_PER_TRANSACTION;

    const paramsClone = structuredClone(classicParams);
    paramsClone.winners = paramsClone.winners.slice(start, end);
    paramsClone.prizeIndices = paramsClone.prizeIndices.slice(start, end);
    logClassicClaims(paramsClone);

    printSpacer();
    printSpacer();
    console.log(
      chalk.green(
        `Execute Claim Transaction for Tier #${tierWords(context, Number(tier))}, claims ${
          start + 1
        } to ${Math.min(end, classicParams.winners.length)} `,
      ),
    );

    const rewards = await getRewards(claimerContract, paramsClone);
    if (rewards.gt(0)) {
      paramsClone.minReward = rewards.mul(90).div(100); // will accept -10% slippage

      // Classic is only on Base, gas limit is normal
      const gasLimit = GAS_LIMIT;

      await sendClaimTransaction(claimerContract, paramsClone, gasLimit, config);
    } else {
      console.log(chalk.yellowBright.bold('Skipping transaction as rewards from simulation are 0'));
    }
  }
};

// Test how much rewards the rewardRecipient will receive
const getRewards = async (
  claimerContract: Contract,
  params: ClaimPrizesParams | ClassicClaimPrizesParams,
): Promise<BigNumber> => {
  let rewards: BigNumber;
  try {
    rewards = await claimerContract.callStatic.claimPrizes(...Object.values(params));
  } catch (e) {
    console.log('Error while checking rewards returned via callStatic simulation');
    console.log(e.message);
  }

  return rewards;
};

const isCanary = (context: PrizeClaimerContext, tier: number): boolean => {
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
  context: PrizeClaimerContext,
  config: PrizeClaimerConfig,
  rewardRecipient: string,
): Promise<ClaimPrizesParams> => {
  const { chainId, covalentApiKey } = config;

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
    config,
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

  const profitable = claimCount >= 1;

  if (profitable) {
    printSpacer();
    printSpacer();
    console.log(chalk.yellow(`Submitting transaction(s) to claim ${claimCount} prize(s):`));
  } else {
    console.log(
      chalk.yellow(`Claiming tier #${tierWords(context, tier)} currently not profitable.`),
    );
  }

  return claimPrizesParams;
};

const tierWords = (context: PrizeClaimerContext, tier: number) => {
  const canaryWords = isCanary(context, tier) ? ' (Canary tier)' : '';

  return `${tier}${canaryWords}`;
};

const logClaims = (params: ClaimPrizesParams) => {
  debugClaimer('claimPrizesParamsClone');
  debugClaimer(params);

  for (let x = 0; x < params.winners.length; x++) {
    const winner = params.winners[x];
    const prizeIndex = params.prizeIndices[x];
    debugClaimer(`${params.vault}-${winner}-${params.tier}-${prizeIndex}`);
  }
};

const logClassicClaims = (params: ClassicClaimPrizesParams) => {
  debugClaimer('classicClaimPrizesParamsClone');
  debugClaimer(params);

  for (let x = 0; x < params.winners.length; x++) {
    const winner = params.winners[x];
    const prizeIndex = params.prizeIndices[x];
    debugClaimer(`${winner}-${params.tier}-${prizeIndex}`);
  }
};

/**
 * Gather information about the given prize pool's reward token price in USD
 * and the last drawId
 * @returns {Promise} Promise of a PrizeClaimerContext object
 */
const getContext = async (
  chainId: number,
  contracts: ContractsBlob,
  prizePool: Contract,
  provider: Provider,
  covalentApiKey?: string,
): Promise<PrizeClaimerContext> => {
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
      prizeTokenBasic.symbol,
      prizeTokenBasic.address,
      covalentApiKey,
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
  context: PrizeClaimerContext,
  provider: Provider,
  claimerContract: Contract,
  tier: number,
  claims: Claim[],
  tierRemainingPrizeCounts: TierRemainingPrizeCounts,
  gasCost: any,
  config: PrizeClaimerConfig,
): Promise<ClaimInfo> => {
  const { minProfitThresholdUsd } = config;

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

    if (netProfitUsd > previousNetProfitUsd && netProfitUsd > minProfitThresholdUsd) {
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
  context: PrizeClaimerContext,
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

function noGpBoosterGrandPrizeWinners(claim) {
  return !Object.values(GP_BOOSTER_CONTRACT_ADDRESSES).includes(claim.winner) && claim.tier !== 0;
}
