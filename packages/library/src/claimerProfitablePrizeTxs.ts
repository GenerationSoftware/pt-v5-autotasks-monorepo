import { ethers, BigNumber, Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Claim, getContract, flagClaimedRpc } from '@generationsoftware/pt-v5-utils-js';
import { Relayer } from 'defender-relay-client';
import groupBy from 'lodash.groupby';
import chalk from 'chalk';
import fetch from 'node-fetch';

import {
  ContractsBlob,
  Token,
  ClaimPrizeContext,
  ExecuteClaimerProfitablePrizeTxsParams,
  TiersContext,
} from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  FLASHBOTS_SUPPORTED_CHAINS,
  MARKET_RATE_CONTRACT_DECIMALS,
  getGasTokenMarketRateUsd,
  roundTwoDecimalPlaces,
  parseBigNumberAsFloat,
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
 * Only claim if we're going to make at least $0.01 (This likely should be a config option)
 */
const MIN_PROFIT_THRESHOLD_USD = 0.01;

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
  const { chainId, feeRecipient } = params;

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePool = getContract('PrizePool', chainId, readProvider, contracts, contractsVersion);
  const claimer = getContract('Claimer', chainId, readProvider, contracts, contractsVersion);
  const marketRate = getContract('MarketRate', chainId, readProvider, contracts, contractsVersion);

  if (!claimer) {
    throw new Error('Contract Unavailable');
  }

  // #1. Get context about the prize pool prize token, etc
  const context: ClaimPrizeContext = await getContext(prizePool, marketRate, readProvider);
  printContext(context);

  // #2. Get data from v5-draw-results
  const drawId = context.drawId.toString();
  let claims = await fetchClaims(chainId, prizePool.address, drawId);

  // #3. Cross-reference prizes claimed to flag if a claim has been claimed or not
  claims = await flagClaimedRpc(readProvider, contracts, claims);

  const unclaimedClaims = claims.filter((claim) => !claim.claimed);
  const claimedClaims = claims.filter((claim) => claim.claimed);
  if (claimedClaims.length === 0) {
    console.log(chalk.dim(`No claimed prizes for draw #${drawId}.`));
  } else {
    console.log(chalk.dim(`${claimedClaims.length} prizes already claimed for draw #${drawId}.`));
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
      chainId,
      contracts,
      vault,
      Number(tier),
      claimer,
      groupedClaims,
      feeRecipient,
      marketRate,
      context,
    );

    // It's profitable if there is at least 1 claim to claim
    // #6. Populate transaction
    if (claimPrizesParams.winners.length > 0) {
      printSpacer();
      console.log(
        chalk.green(`Execute Claim Transaction for Tier #${tierWords(context, Number(tier))}`),
      );
      printSpacer();

      const chainSupportsFlashbots = FLASHBOTS_SUPPORTED_CHAINS.includes(chainId);
      const isPrivate = chainSupportsFlashbots && params.useFlashbots;

      console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
      printSpacer();

      const populatedTx = await claimer.populateTransaction.claimPrizes(
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
  return context.tiers.rangeArray.length - 1 === tier;
};

/**
 * Figures out how much gas is required to run the contract function
 *
 * @returns {Promise} Promise of a BigNumber with the gas limit
 */
const getEstimatedGasLimit = async (
  claimer: Contract,
  claimPrizesParams: ClaimPrizesParams,
): Promise<BigNumber> => {
  let estimatedGasLimit;
  try {
    estimatedGasLimit = await claimer.estimateGas.claimPrizes(...Object.values(claimPrizesParams));
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
  chainId: number,
  contracts: ContractsBlob,
  vault: string,
  tier: number,
  claimer: Contract,
  unclaimedClaims: any,
  feeRecipient: string,
  marketRate: Contract,
  context: ClaimPrizeContext,
): Promise<ClaimPrizesParams> => {
  printSpacer();
  const gasTokenMarketRateUsd = await getGasTokenMarketRateUsd(contracts, marketRate);
  logStringValue(
    `Native (Gas) Token ${NETWORK_NATIVE_TOKEN_INFO[chainId].symbol} Market Rate (USD):`,
    gasTokenMarketRateUsd,
  );

  printSpacer();
  const gasCost = await getGasCost(
    readProvider,
    chainId,
    vault,
    tier,
    claimer,
    unclaimedClaims,
    feeRecipient,
    gasTokenMarketRateUsd,
  );

  const { claimCount, claimFeesUsd, totalCostUsd } = await getClaimInfo(
    context,
    claimer,
    tier,
    unclaimedClaims,
    gasCost,
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
  logTable({
    MIN_PROFIT_THRESHOLD_USD: `$${MIN_PROFIT_THRESHOLD_USD}`,
    'Net profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
    'Profitable?': profitable ? '✔' : '✗',
  });
  printSpacer();

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
  const tiersArray = context.tiers.rangeArray;

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
  prizePool: Contract,
  marketRate: Contract,
  readProvider: Provider,
): Promise<ClaimPrizeContext> => {
  const feeTokenAddress = await prizePool.prizeToken();
  const drawId = await prizePool.getLastCompletedDrawId();

  const numberOfTiers = await prizePool.numberOfTiers();
  const rangeArray = Array.from({ length: numberOfTiers }, (value, index) => index);
  const tiers: TiersContext = { numberOfTiers, rangeArray };

  const tokenInContract = new ethers.Contract(feeTokenAddress, ERC20Abi, readProvider);

  const feeToken = {
    address: feeTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol(),
  };

  const feeTokenRateUsd = await getFeeTokenRateUsd(marketRate, feeToken);

  return { feeToken, drawId, feeTokenRateUsd, tiers };
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
    `$${context.feeTokenRateUsd}`,
  );
};

/**
 * Finds the spot price of the fee token in USD
 * @returns {number} feeTokenRateUsd
 */
const getFeeTokenRateUsd = async (marketRate: Contract, feeToken: Token): Promise<number> => {
  const feeTokenAddress = feeToken.address;
  const feeTokenRate = await marketRate.priceFeed(feeTokenAddress, 'USD');

  return parseBigNumberAsFloat(feeTokenRate, MARKET_RATE_CONTRACT_DECIMALS);
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
  claimer: Contract,
  claims: Claim[],
  feeRecipient: string,
  gasTokenMarketRateUsd: number,
) => {
  let claimsSlice = claims.slice(0, 1);
  let claimPrizesParams = buildParams(vault, tier, claimsSlice, feeRecipient);

  let estimatedGasLimitForOne = await getEstimatedGasLimit(claimer, claimPrizesParams);
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

    estimatedGasLimitForTwo = await getEstimatedGasLimit(claimer, claimPrizesParams);
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

  const gasCostPerClaim =
    claims.length > 1
      ? estimatedGasLimitForTwo.sub(estimatedGasLimitForOne)
      : estimatedGasLimitForOne;
  const setupGasCost = claims.length > 1 && estimatedGasLimitForTwo.sub(gasCostPerClaim);
  if (claims.length > 1) {
    logBigNumber(
      'Setup Gas Cost (wei):',
      setupGasCost,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
    );
  }
  logBigNumber(
    'Gas Cost Per Claim (wei):',
    gasCostPerClaim,
    NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );

  // 4. Convert gas costs to USD
  printSpacer();
  const { maxFeeUsd: setupGasCostUsd } = await getFeesUsd(
    chainId,
    setupGasCost,
    gasTokenMarketRateUsd,
    readProvider,
  );
  logStringValue(`Setup Gas Cost (USD):`, `$${roundTwoDecimalPlaces(setupGasCostUsd)}`);
  console.log(chalk.dim(`$${setupGasCostUsd}`));
  const { maxFeeUsd: gasCostPerClaimUsd } = await getFeesUsd(
    chainId,
    gasCostPerClaim,
    gasTokenMarketRateUsd,
    readProvider,
  );
  logStringValue(`Gas Cost Per Claim (USD):`, `$${roundTwoDecimalPlaces(gasCostPerClaimUsd)}`);
  console.log(chalk.dim(`$${gasCostPerClaimUsd}`));

  return { setupGasCost, gasCostPerClaim, setupGasCostUsd, gasCostPerClaimUsd };
};

interface ClaimInfo {
  claimCount: number;
  claimFeesUsd: number;
  totalCostUsd: number;
}

const getClaimInfo = async (
  context: ClaimPrizeContext,
  claimer: Contract,
  tier: number,
  claims: Claim[],
  gasCost: any,
): Promise<ClaimInfo> => {
  let claimCount = 0;
  let claimFees = BigNumber.from(0);
  let claimFeesUsd = 0;
  let totalCostUsd = 0;
  for (let numClaims = 1; numClaims <= claims.length; numClaims++) {
    printSpacer();
    printSpacer();
    console.log(chalk.bgBlack.cyan(`5b. Profit for ${numClaims} claims:`));

    const nextClaimFees = await claimer.computeTotalFees(tier, numClaims);
    printSpacer();

    // COSTS USD
    const claimCostUsd = gasCost.gasCostPerClaimUsd * numClaims;
    totalCostUsd = gasCost.setupGasCostUsd + claimCostUsd;

    printSpacer();

    console.log(
      chalk.green('Total Cost (USD):', `$${roundTwoDecimalPlaces(totalCostUsd)}`),
      chalk.dim(`($${totalCostUsd})`),
    );
    printSpacer();

    // FEES USD
    claimFeesUsd =
      parseFloat(ethers.utils.formatUnits(claimFees, context.feeToken.decimals)) *
      context.feeTokenRateUsd;
    logBigNumber(
      'Claim Fees (WEI):',
      claimFees,
      context.feeToken.decimals,
      context.feeToken.symbol,
    );
    console.log(
      chalk.green('Claim Fees (USD):', `$${roundTwoDecimalPlaces(claimFeesUsd)}`),
      chalk.dim(`($${claimFeesUsd})`),
    );
    printSpacer();

    const nextClaimFeesUsd =
      parseFloat(ethers.utils.formatUnits(nextClaimFees, context.feeToken.decimals)) *
      context.feeTokenRateUsd;

    logBigNumber(
      'Next Claim Fees (WEI):',
      nextClaimFees,
      context.feeToken.decimals,
      context.feeToken.symbol,
    );
    console.log(
      chalk.green('Next Claim Fees (USD):', `$${roundTwoDecimalPlaces(nextClaimFeesUsd)}`),
      chalk.dim(`($${nextClaimFeesUsd})`),
    );
    printSpacer();

    // To push through 1 non-profitable tx for debugging:
    // if (numClaims === 1) {
    // claimCount = numClaims;
    // claimFees = nextClaimFees;
    //   return { claimCount, claimFeesUsd, totalCostUsd };
    // }

    if (nextClaimFeesUsd - claimFeesUsd > totalCostUsd) {
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
  drawId: string,
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
