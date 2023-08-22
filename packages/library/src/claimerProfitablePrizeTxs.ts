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
import { Relayer } from 'defender-relay-client';
import groupBy from 'lodash.groupby';
import chalk from 'chalk';
import fetch from 'node-fetch';

import {
  ClaimPrizeContext,
  ExecuteClaimerProfitablePrizeTxsParams,
  TiersContext,
  Token,
  TokenWithRate,
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
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';

interface ClaimPrizesParams {
  vault: string;
  tier: number;
  winners: string[];
  prizeIndices: number[][];
  feeRecipient: string;
}

/**
 * Finds all winners for the current draw who have unclaimed prizes and decides if it's profitable
 * to claim for them. The fees the claimer bot can earn increase exponentially over time.
 *
 * @returns {undefined} void function
 */
export async function executeClaimerProfitablePrizeTxs(
  contracts: ContractsBlob,
  relayer: Relayer,
  readProvider: Provider,
  params: ExecuteClaimerProfitablePrizeTxsParams,
): Promise<undefined> {
  const { chainId, covalentApiKey, useFlashbots } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePool = getContract('PrizePool', chainId, readProvider, contracts, contractsVersion);
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
  const context: ClaimPrizeContext = await getContext(
    contracts,
    prizePool,
    readProvider,
    covalentApiKey,
  );
  printContext(context);

  // #2. Get data from v5-draw-results
  let claims = await fetchClaims(chainId, prizePool.address, context.drawId);

  // #3. Cross-reference prizes claimed to flag if a claim has been claimed or not
  claims = await flagClaimedRpc(readProvider, contracts, claims);

  const unclaimedClaims = claims.filter((claim) => !claim.claimed);
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

  // #4. Group claims by vault & tier
  const unclaimedClaimsGrouped = groupBy(unclaimedClaims, (item) => [item.vault, item.tier]);

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

    if (isCanary(context, Number(tier)) && canaryTierNotProfitable) {
      printSpacer();
      console.log(
        chalk.redBright(`Tier #${tierWords(context, Number(tier))} not profitable, skipping ...`),
      );
      printSpacer();
      continue;
    }

    // #5. Decide if profitable or not
    printSpacer();
    console.log(chalk.blue(`5a. Calculating # of profitable claims ...`));

    const claimPrizesParams = await calculateProfit(
      readProvider,
      vault,
      Number(tier),
      claimerContract,
      groupedClaims,
      context,
      params,
    );

    // It's profitable if there is at least 1 claim to claim
    // #6. Populate transaction
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

      console.log(chalk.greenBright.bold(`Sending transaction ...`));
      const tx = await relayer.sendTransaction({
        isPrivate,
        data: populatedTx.data,
        to: populatedTx.to,
        gasLimit: 8000000,
      });

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
  unclaimedClaims: any,
  context: ClaimPrizeContext,
  params: ExecuteClaimerProfitablePrizeTxsParams,
): Promise<ClaimPrizesParams> => {
  const { chainId, minProfitThresholdUsd, feeRecipient } = params;

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
    unclaimedClaims,
    feeRecipient,
    nativeTokenMarketRateUsd,
  );

  const { claimCount, claimFeesUsd, totalCostUsd } = await getClaimInfo(
    context,
    claimerContract,
    tier,
    unclaimedClaims,
    gasCost,
    minProfitThresholdUsd,
  );

  const claimsSlice = unclaimedClaims.slice(0, claimCount);
  const claimPrizesParams = buildParams(vault, tier, claimsSlice, feeRecipient);

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

  const prizePoolInfo: PrizePoolInfo = await getPrizePoolInfo(readProvider, contracts);
  const { drawId, numTiers, tiersRangeArray } = prizePoolInfo;
  const tiers: TiersContext = { numTiers, tiersRangeArray };

  const feeTokenContract = new ethers.Contract(feeTokenAddress, ERC20Abi, readProvider);

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

  return { feeToken, drawId, tiers };
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
) => {
  let claimsSlice = claims.slice(0, 1);
  let claimPrizesParams = buildParams(vault, tier, claimsSlice, feeRecipient);

  let estimatedGasLimitForOne = await getEstimatedGasLimit(claimerContract, claimPrizesParams);
  if (!estimatedGasLimitForOne || estimatedGasLimitForOne.eq(0)) {
    console.error(chalk.yellow('Estimated gas limit is 0 ...'));
  } else {
    logBigNumber(
      'Estimated gas limit (1 prize claim):',
      estimatedGasLimitForOne,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
    );
  }

  // 2. Gas cost for 2 claims:
  let estimatedGasLimitForTwo;
  if (claims.length > 1) {
    claimsSlice = claims.slice(0, 2);
    claimPrizesParams = buildParams(vault, tier, claimsSlice, feeRecipient);

    estimatedGasLimitForTwo = await getEstimatedGasLimit(claimerContract, claimPrizesParams);
    if (!estimatedGasLimitForTwo || estimatedGasLimitForTwo.eq(0)) {
      console.error(chalk.yellow('Estimated gas limit is 0 ...'));
    } else {
      logBigNumber(
        'Estimated gas limit (2 prize claims):',
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
  const { maxFeeUsd: gasCostOneClaimUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimitForOne,
    gasTokenMarketRateUsd,
    readProvider,
  );
  console.log(
    chalk.grey(`Gas Cost: First Claim (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(gasCostOneClaimUsd)}`),
    chalk.dim(`$${gasCostOneClaimUsd}`),
  );

  const { maxFeeUsd: gasCostEachFollowingClaimUsd } = await getFeesUsd(
    chainId,
    gasCostEachFollowingClaim,
    gasTokenMarketRateUsd,
    readProvider,
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
}

const getClaimInfo = async (
  context: ClaimPrizeContext,
  claimerContract: Contract,
  tier: number,
  claims: Claim[],
  gasCost: any,
  minProfitThresholdUsd: number,
): Promise<ClaimInfo> => {
  let claimCount = 0;
  let claimFees = BigNumber.from(0);
  let claimFeesUsd = 0;
  let totalCostUsd = 0;
  let prevTotalFeesMinusCostUsd = 0;
  for (let numClaims = 1; numClaims <= claims.length; numClaims++) {
    printSpacer();
    printSpacer();
    console.log(chalk.bgBlack.cyan(`5b. Profit for ${numClaims} Claim(s):`));

    const nextClaimFees = await claimerContract.functions['computeTotalFees(uint8,uint256)'](
      tier,
      numClaims,
    );
    printSpacer();

    // COSTS USD
    const totalCostUsd =
      numClaims === 1
        ? gasCost.gasCostOneClaimUsd
        : gasCost.gasCostOneClaimUsd + gasCost.gasCostEachFollowingClaimUsd * numClaims;

    printSpacer();

    console.log(
      chalk.green('Total Cost (USD):', `$${roundTwoDecimalPlaces(totalCostUsd)}`),
      chalk.dim(`($${totalCostUsd})`),
    );
    printSpacer();

    // FEES USD
    claimFeesUsd =
      parseFloat(ethers.utils.formatUnits(claimFees.toString(), context.feeToken.decimals)) *
      context.feeToken.assetRateUsd;
    if (claimCount > 0) {
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
    //   return { claimCount, claimFeesUsd, totalCostUsd };
    // }

    const feeDiff = nextClaimFeesUsd - claimFeesUsd;
    console.log('feeDiff');
    console.log(feeDiff);

    printSpacer();

    console.log('minProfitThresholdUsd');
    console.log(minProfitThresholdUsd);
    printSpacer();

    const totalFeesMinusCostUsd = nextClaimFeesUsd - totalCostUsd;
    console.log('totalFeesMinusCostUsd');
    console.log(totalFeesMinusCostUsd);
    printSpacer();

    console.log('prevTotalFeesMinusCostUsd');
    console.log(prevTotalFeesMinusCostUsd);

    printSpacer();
    console.log('totalFeesMinusCostUsd > prevTotalFeesMinusCostUsd');
    console.log(totalFeesMinusCostUsd > prevTotalFeesMinusCostUsd);

    printSpacer();
    console.log('totalFeesMinusCostUsd > minProfitThresholdUsd');
    console.log(totalFeesMinusCostUsd > minProfitThresholdUsd);

    if (
      totalFeesMinusCostUsd > prevTotalFeesMinusCostUsd &&
      totalFeesMinusCostUsd > minProfitThresholdUsd
    ) {
      prevTotalFeesMinusCostUsd = totalFeesMinusCostUsd;
      claimCount = numClaims;
      claimFees = nextClaimFees;
      claimFeesUsd = nextClaimFeesUsd;
    } else {
      break;
    }
  }

  return { claimCount, claimFeesUsd, totalCostUsd };
};

const fetchClaims = async (
  chainId: number,
  prizePoolAddress: string,
  drawId: number,
): Promise<Claim[]> => {
  let claims: Claim[] = [];
  const uri = `https://raw.githubusercontent.com/GenerationSoftware/pt-v5-draw-results/main/prizes/${chainId}/${prizePoolAddress.toLowerCase()}/draw/${drawId}/prizes.json`;

  try {
    const response = await fetch(uri);
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
