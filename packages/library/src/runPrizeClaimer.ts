import { ethers, BigNumber, Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import {
  ContractsBlob,
  Claim,
  PrizePoolInfo,
  getPrizePoolInfo,
  getContract,
  flagClaimedRpc,
} from '@generationsoftware/pt-v5-utils-js';
import groupBy from 'lodash.groupby';
import chalk from 'chalk';
import fetch from 'node-fetch';

import {
  ClaimPrizeContext,
  PrizeClaimerConfigParams,
  TiersContext,
  Token,
  TokenWithRate,
  SendTransactionArgs,
  OzSendTransactionArgs,
  WalletSendTransactionArgs,
} from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  canUseIsPrivate,
  roundTwoDecimalPlaces,
  getFeesUsd,
  getEthMainnetTokenMarketRateUsd,
  getNativeTokenMarketRateUsd,
  getGasPrice,
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';
import { getDrawResultsUri } from './getDrawResultsUri';
import { sendPopulatedTx } from './helpers/sendPopulatedTx';

interface ClaimPrizesParams {
  vault: string;
  tier: number;
  winners: string[];
  prizeIndices: number[][];
  feeRecipient: string;
  minVrgdaFeePerClaim: string;
}

interface TierRemainingPrizeCounts {
  [tierNum: string]: number;
}

const TOTAL_CLAIM_COUNT_PER_TRANSACTION = 60;

/**
 * Finds all winners for the current draw who have unclaimed prizes and decides if it's profitable
 * to claim for them. The fees the claimer bot can earn increase exponentially over time.
 *
 * @returns {undefined} void function
 */
export async function runPrizeClaimer(
  contracts: ContractsBlob,
  prizeClaimerConfigParams: PrizeClaimerConfigParams,
): Promise<undefined> {
  const {
    chainId,
    covalentApiKey,
    useFlashbots,
    ozRelayer,
    wallet,
    readProvider,
  } = prizeClaimerConfigParams;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePoolContract = getContract(
    'PrizePool',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );
  const claimerContract = getContract(
    'Claimer',
    chainId,
    readProvider,
    contracts,
    contractsVersion,
  );

  if (!claimerContract) {
    throw new Error('Contract Unavailable');
  }

  // #1. Get context about the prize pool prize token, etc
  printSpacer();
  console.log(chalk.dim('Starting ...'));
  const context: ClaimPrizeContext = await getContext(
    contracts,
    prizePoolContract,
    readProvider,
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
    return;
  }

  // #2. Get data from v5-draw-results
  let claims = await fetchClaims(chainId, prizePoolContract.address, context.drawId);

  // #3. Cross-reference prizes claimed to flag if a claim has been claimed or not
  claims = await flagClaimedRpc(readProvider, contracts, claims);

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
        chalk.redBright(`Tier #${tierWords(context, Number(tier))} insuff liquidity, skipping ...`),
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

    // #6. Decide if profitable or not
    printSpacer();
    console.log(chalk.blue(`5a. Calculating # of profitable claims ...`));

    const claimPrizesParams = await calculateProfit(
      readProvider,
      vault,
      Number(tier),
      claimerContract,
      groupedClaims,
      tierRemainingPrizeCounts,
      context,
      prizeClaimerConfigParams,
    );

    // It's profitable if there is at least 1 claim to claim
    // #7. Populate transaction
    if (claimPrizesParams.winners.length > 0) {
      printSpacer();
      console.log(
        chalk.green(`Execute Claim Transaction for Tier #${tierWords(context, Number(tier))}`),
      );
      printSpacer();

      const isPrivate = canUseIsPrivate(chainId, useFlashbots);

      console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
      printSpacer();

      const populatedTx = await claimerContract.populateTransaction.claimPrizes(
        ...Object.values(claimPrizesParams),
      );

      const gasLimit = 20000000;
      const { gasPrice } = await getGasPrice(readProvider);
      const tx = await sendPopulatedTx(
        ozRelayer,
        wallet,
        populatedTx,
        gasLimit,
        gasPrice,
        useFlashbots,
      );

      // console.log(chalk.greenBright.bold(`Sending transaction ...`));
      // const tx = await ozRelayer.sendTransaction({
      //   isPrivate,
      //   data: populatedTx.data,
      //   to: populatedTx.to,
      //   gasLimit: 20000000,
      // });
      console.log(chalk.greenBright.bold('Transaction sent! ✔'));
      console.log(chalk.blueBright.bold('Transaction hash:', tx.hash));

      // NOTE: This uses a naive method of waiting for the tx since OZ Defender can
      //       re-submit transactions, effectively giving them different tx hashes
      //       It is likely good enough for these types of transactions but could cause
      //       issues if there are a lot of failures or gas price issues
      //       See querying here:
      //       https://github.com/OpenZeppelin/defender-client/tree/master/packages/relay#querying-transactions
      console.log('Waiting on transaction to be confirmed ...');
      await readProvider.waitForTransaction(tx.hash);
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
}

const isCanary = (context: ClaimPrizeContext, tier: number): boolean => {
  return context.tiers.tiersRangeArray.length - 1 === tier;
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
  readProvider: Provider,
  vault: string,
  tier: number,
  claimerContract: Contract,
  groupedClaims: any,
  tierRemainingPrizeCounts: TierRemainingPrizeCounts,
  context: ClaimPrizeContext,
  prizeClaimerConfigParams: PrizeClaimerConfigParams,
): Promise<ClaimPrizesParams> => {
  const { chainId, minProfitThresholdUsd, feeRecipient } = prizeClaimerConfigParams;

  printSpacer();
  const nativeTokenMarketRateUsd = await getNativeTokenMarketRateUsd(chainId);
  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    `$${nativeTokenMarketRateUsd}`,
  );

  printSpacer();
  const gasCost = await getGasCost(
    readProvider,
    chainId,
    vault,
    tier,
    claimerContract,
    groupedClaims,
    feeRecipient,
    nativeTokenMarketRateUsd,
    '100',
  );

  const { claimCount, claimFeesUsd, totalCostUsd, minVrgdaFeePerClaim } = await getClaimInfo(
    context,
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
    feeRecipient,
    minVrgdaFeePerClaim,
  );

  printAsterisks();
  console.log(chalk.magenta('5c. Profit/Loss (USD):'));
  printSpacer();

  // FEES USD
  const netProfitUsd = claimFeesUsd - totalCostUsd;
  console.log(chalk.magenta('Net profit = (Earned fees - Gas cost [Max])'));
  console.log(
    chalk.greenBright(
      `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
        claimFeesUsd,
      )} - $${roundTwoDecimalPlaces(totalCostUsd)})`,
    ),
    chalk.dim(`$${netProfitUsd} = ($${claimFeesUsd} - $${totalCostUsd})`),
  );
  printSpacer();

  const profitable = claimCount > 1;
  // logTable({
  //   MIN_PROFIT_THRESHOLD_USD: `$${minProfitThresholdUsd}`,
  //   'Net profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
  //   'Profitable?': profitable ? '✔' : '✗',
  // });
  // printSpacer();

  if (profitable) {
    console.log(chalk.yellow(`Submitting transaction to claim ${claimCount} prize(s):`));
    logClaims(claimsSlice);
  } else {
    // console.log(
    //   chalk.yellow(`Claiming tier #${tierWords(context, tier)} currently not profitable.`),
    // );
  }

  return claimPrizesParams;
};

const tierWords = (context: ClaimPrizeContext, tier: number) => {
  const tiersArray = context.tiers.tiersRangeArray;

  const canaryWords = tiersArray.length - 1 === tier ? ' (Canary tier)' : '';

  return `${tier + 1}${canaryWords}`;
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
 * Gather information about the given prize pool's fee token, fee token price in USD
 * and the last drawId
 * @returns {Promise} Promise of a ClaimPrizeContext object
 */
const getContext = async (
  contracts: ContractsBlob,
  prizePool: Contract,
  readProvider: Provider,
  covalentApiKey?: string,
): Promise<ClaimPrizeContext> => {
  const feeTokenAddress = await prizePool.prizeToken();

  console.log(chalk.dim('Getting prize pool info ...'));

  const prizePoolInfo: PrizePoolInfo = await getPrizePoolInfo(readProvider, contracts);
  const { drawId, isDrawFinalized, numTiers, tiersRangeArray, tierPrizeData } = prizePoolInfo;
  const tiers: TiersContext = { numTiers, tiersRangeArray };

  const feeTokenContract = new ethers.Contract(feeTokenAddress, ERC20Abi, readProvider);

  console.log(chalk.dim('Getting prize context ...'));

  const feeTokenBasic: Token = {
    address: feeTokenAddress,
    decimals: await feeTokenContract.decimals(),
    name: await feeTokenContract.name(),
    symbol: await feeTokenContract.symbol(),
  };

  const feeToken: TokenWithRate = {
    ...feeTokenBasic,
    assetRateUsd: await getEthMainnetTokenMarketRateUsd(
      feeTokenBasic.symbol,
      feeTokenBasic.address,
      covalentApiKey,
    ),
  };

  return { feeToken, drawId, isDrawFinalized, tiers, tierPrizeData };
};

/**
 * Logs the context to the console
 * @returns {undefined} void function
 */
const printContext = (context) => {
  printAsterisks();
  console.log(chalk.blue.bold(`1. Prize token: ${context.feeToken.symbol}`));
  printSpacer();

  logTable({ feeToken: context.feeToken });
  logTable({ tiers: context.tiers });
  logStringValue('Draw ID:', context.drawId);
  logStringValue(
    `Fee Token ${context.feeToken.symbol} MarketRate USD: `,
    `$${context.feeToken.assetRateUsd}`,
  );
};

const buildParams = (
  vault: string,
  tier: number,
  claims: Claim[],
  feeRecipient: string,
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
    feeRecipient,
    minVrgdaFeePerClaim,
  };
};

const getGasCost = async (
  readProvider: Provider,
  chainId: number,
  vault: string,
  tier: number,
  claimerContract: Contract,
  claims: Claim[],
  feeRecipient: string,
  gasTokenMarketRateUsd: number,
  estimateMinFee: string,
) => {
  let claimsSlice = claims.slice(0, 1);
  let claimPrizesParams = buildParams(vault, tier, claimsSlice, feeRecipient, estimateMinFee);

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
    readProvider,
    populatedTx.data,
  );

  // 2. Gas cost for 2 claims:
  let estimatedGasLimitForTwo;
  if (claims.length > 1) {
    claimsSlice = claims.slice(0, 2);
    claimPrizesParams = buildParams(vault, tier, claimsSlice, feeRecipient, estimateMinFee);

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
    claims.length > 1
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
    readProvider,
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
  claimFeesUsd: number;
  totalCostUsd: number;
  minVrgdaFeePerClaim: string;
}

const getClaimInfo = async (
  context: ClaimPrizeContext,
  claimerContract: Contract,
  tier: number,
  claims: Claim[],
  tierRemainingPrizeCounts: TierRemainingPrizeCounts,
  gasCost: any,
  minProfitThresholdUsd: number,
): Promise<ClaimInfo> => {
  let claimCount = 0;
  let claimFees = BigNumber.from(0);
  let claimFeesUsd = 0;
  let totalCostUsd = 0;
  let previousNetProfitUsd = 0;
  let minVrgdaFeePerClaim = BigNumber.from(0);
  for (let numClaims = 1; numClaims <= claims.length; numClaims++) {
    printSpacer();
    console.log(chalk.cyanBright(`5b. ${numClaims} Claim(s):`));

    // If there's only liquidity for say 4 prizes and our target
    // claim count is 10 we'll stop the loop at 4
    if (tierRemainingPrizeCounts[tier.toString()] === 0) {
      printSpacer();
      console.log(
        chalk.redBright(
          `Tier #${tierWords(context, Number(tier))} insuff liquidity, exiting tier ...`,
        ),
      );
      printSpacer();
      break;
    }

    const nextClaimFees = await claimerContract.functions['computeTotalFees(uint8,uint256)'](
      tier,
      numClaims,
    );

    // COSTS USD
    const totalCostUsd =
      numClaims === 1
        ? gasCost.gasCostOneClaimUsd
        : gasCost.gasCostOneClaimUsd + gasCost.gasCostEachFollowingClaimUsd * (numClaims - 1);

    printSpacer();

    console.log(
      chalk.green(
        `Total Gas Fees: ${numClaims} Claim(s) (USD):`,
        `$${roundTwoDecimalPlaces(totalCostUsd)}`,
      ),
      chalk.dim(`($${totalCostUsd})`),
    );
    printSpacer();

    if (claimCount !== 0) {
      claimFeesUsd =
        parseFloat(ethers.utils.formatUnits(claimFees.toString(), context.feeToken.decimals)) *
        context.feeToken.assetRateUsd;
      logBigNumber(
        `Claim Fees: ${claimCount} Claim(s) (WEI):`,
        claimFees,
        context.feeToken.decimals,
        context.feeToken.symbol,
      );
      console.log(
        chalk.green(
          `Claim Fees: ${claimCount} Claim(s) (USD):`,
          `$${roundTwoDecimalPlaces(claimFeesUsd)}`,
        ),
        chalk.dim(`($${claimFeesUsd})`),
      );
      printSpacer();
    }

    const nextClaimFeesUsd =
      parseFloat(ethers.utils.formatUnits(nextClaimFees.toString(), context.feeToken.decimals)) *
      context.feeToken.assetRateUsd;
    logBigNumber(
      `Next Claim Fees: ${numClaims} Claim(s) (WEI):`,
      nextClaimFees,
      context.feeToken.decimals,
      context.feeToken.symbol,
    );
    console.log(
      chalk.green(
        `Next Claim Fees: ${numClaims} Claim(s) (USD):`,
        `$${roundTwoDecimalPlaces(nextClaimFeesUsd)}`,
      ),
      chalk.dim(`($${nextClaimFeesUsd})`),
    );
    printSpacer();

    // To push through 1 non-profitable tx for debugging:
    // if (numClaims === 1) {
    //   claimCount = numClaims;
    //   claimFees = nextClaimFees;
    //   minVrgdaFeePerClaim = nextClaimFees.toString();
    //   return { claimCount, claimFeesUsd, totalCostUsd, minVrgdaFeePerClaim };
    // }

    const netProfitUsd = nextClaimFeesUsd - totalCostUsd;

    // DEBUG INFO
    // const feeDiff = nextClaimFeesUsd - claimFeesUsd;
    // console.log('feeDiff');
    // console.log(feeDiff);
    // printSpacer();

    // console.log('netProfitUsd');
    // console.log(netProfitUsd);
    // printSpacer();

    // console.log('minProfitThresholdUsd');
    // console.log(minProfitThresholdUsd);
    // printSpacer();

    // console.log('previousNetProfitUsd');
    // console.log(previousNetProfitUsd);
    // printSpacer();

    // console.log('netProfitUsd > previousNetProfitUsd');
    // console.log(netProfitUsd > previousNetProfitUsd);
    // printSpacer();

    // console.log('netProfitUsd > minProfitThresholdUsd');
    // console.log(netProfitUsd > minProfitThresholdUsd);
    // printSpacer();
    // END DEBUG INFO

    console.log(chalk.magenta('Net profit = (Gross Profit - Gas Fees [Avg])'));
    console.log(
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
          nextClaimFeesUsd,
        )} - $${roundTwoDecimalPlaces(totalCostUsd)})`,
      ),
      chalk.dim(`$${netProfitUsd} = ($${nextClaimFeesUsd} - $${totalCostUsd})`),
    );

    if (
      netProfitUsd > previousNetProfitUsd &&
      netProfitUsd > minProfitThresholdUsd &&
      numClaims < TOTAL_CLAIM_COUNT_PER_TRANSACTION
    ) {
      tierRemainingPrizeCounts[tier.toString()]--;

      const claimFeesUnpacked = claimFees[0] ? claimFees[0] : claimFees;
      minVrgdaFeePerClaim = nextClaimFees[0].sub(claimFeesUnpacked);

      previousNetProfitUsd = netProfitUsd;
      claimCount = numClaims;
      claimFees = nextClaimFees;
      claimFeesUsd = nextClaimFeesUsd;

      printSpacer();
    } else {
      break;
    }
  }

  return {
    claimCount,
    claimFeesUsd,
    totalCostUsd,
    minVrgdaFeePerClaim: minVrgdaFeePerClaim.toString(),
  };
};

const fetchClaims = async (
  chainId: number,
  prizePoolAddress: string,
  drawId: number,
): Promise<Claim[]> => {
  let claims: Claim[] = [];

  const drawResultsUri = getDrawResultsUri(chainId, prizePoolAddress, drawId);

  try {
    const response = await fetch(drawResultsUri);
    if (!response.ok) {
      console.log(chalk.yellow(`Draw results not yet populated for new draw.`));
      throw new Error(response.statusText);
    }
    claims = await response.json();
  } catch (err) {
    console.log(err);
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
