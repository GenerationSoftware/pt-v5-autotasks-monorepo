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

import {
  Token,
  DrawAuctionContext,
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
  canUseIsPrivate,
  MARKET_RATE_CONTRACT_DECIMALS,
  getGasTokenMarketRateUsd,
  roundTwoDecimalPlaces,
  parseBigNumberAsFloat,
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';

// RNGAuction.sol;
// interface StartRngRequestParams {
//   rewardRecipient: string;
// }

// interface CompleteDrawParams {
//   rewardRecipient: string;
// }

interface TxParams {
  rewardRecipient: string;
}

// // RNGAuction.sol;
//
// isRNGRequested;
// isRNGCompleted;
// isRNGAuctionOpen;

// rngAuctionElapsedTime;
// getRNGRequest;
// getRNGRequestId;
// getRNGService;
// getDrawPeriodOffset;
// getDrawPeriod;
// getAuctionDuration;

// startRNGRequest;

// // DrawAuction.sol
//
// auctionName;
//
// completeDraw;

// originChainId;

/**
 * Finds all winners for the current draw who have unclaimed prizes and decides if it's profitable
 * to claim for them. The fees the claimer bot can earn increase exponentially over time.
 *
 * @returns {undefined} void function
 */
export async function prepareDrawAuctionTxs(
  contracts: ContractsBlob,
  relayer: Relayer,
  readProvider: Provider,
  params: ExecuteClaimerProfitablePrizeTxsParams,
): Promise<undefined> {
  const { chainId, feeRecipient, useFlashbots, minProfitThresholdUsd } = params;

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
  const context: ClaimPrizeContext = await getContext(
    contracts,
    prizePool,
    marketRate,
    readProvider,
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
      chainId,
      contracts,
      vault,
      Number(tier),
      claimer,
      groupedClaims,
      feeRecipient,
      minProfitThresholdUsd,
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

      const isPrivate = canUseIsPrivate(chainId, useFlashbots);

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
  minProfitThresholdUsd: number,
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
  contracts: ContractsBlob,
  prizePool: Contract,
  marketRate: Contract,
  readProvider: Provider,
): Promise<ClaimPrizeContext> => {
  const feeTokenAddress = await prizePool.prizeToken();

  const prizePoolInfo: PrizePoolInfo = await getPrizePoolInfo(readProvider, contracts);
  const { drawId, numberOfTiers, tiersRangeArray } = prizePoolInfo;
  const tiers: TiersContext = { numberOfTiers, rangeArray: tiersRangeArray };

  const tokenInContract = new ethers.Contract(feeTokenAddress, ERC20Abi, readProvider);

  const feeToken = {
    address: feeTokenAddress,
    decimals: await tokenInContract.decimals(),
    name: await tokenInContract.name(),
    symbol: await tokenInContract.symbol(),
  };

  const feeTokenRateUsd = await getRewardTokenRateUsd(marketRate, feeToken);

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
 * Finds the spot price of the reward token in USD
 * @returns {number} rewardTokenRateUsd
 */
const getRewardTokenRateUsd = async (marketRate: Contract, RewardToken: Token): Promise<number> => {
  const RewardTokenAddress = RewardToken.address;
  const RewardTokenRate = await marketRate.priceFeed(rewardTokenAddress, 'USD');

  return parseBigNumberAsFloat(rewardTokenRate, MARKET_RATE_CONTRACT_DECIMALS);
};

const buildParams = (rewardRecipient: string): TxParams => {
  return {
    rewardRecipient,
  };
};

const getGasCost = async (
  readProvider: Provider,
  chainId: number,
  claimer: Contract,
  rewardRecipient: string,
  gasTokenMarketRateUsd: number,
) => {
  let txParams = buildParams(rewardRecipient);

  let estimatedGasLimit = await getEstimatedGasLimit(claimer, txParams);
  if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
    console.error(chalk.yellow('Estimated gas limit is 0 ...'));
  } else {
    logBigNumber(
      'Estimated gas limit (1 prize claim):',
      estimatedGasLimit,
      NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
      NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
    );
  }

  printSpacer();

  logBigNumber(
    'Gas Cost (wei):',
    estimatedGasLimit,
    NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
    NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
  );

  // 3. Convert gas costs to USD
  printSpacer();
  const { maxFeeUsd: gasCostUsd } = await getFeesUsd(
    chainId,
    estimatedGasLimit,
    gasTokenMarketRateUsd,
    readProvider,
  );
  console.log(
    chalk.grey(`Gas Cost: First Claim (USD):`),
    chalk.yellow(`$${roundTwoDecimalPlaces(gasCostUsd)}`),
    chalk.dim(`$${gasCostUsd}`),
  );

  return {
    gasCostUsd,
  };
};
