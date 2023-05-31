import { ethers, BigNumber, Contract } from 'ethers';
import { PopulatedTransaction } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import {
  ClaimedPrize,
  getContract,
  getSubgraphVaults,
  getSubgraphClaimedPrizes,
  getWinnersClaims,
} from '@pooltogether/v5-utils-js';
import chalk from 'chalk';

import {
  ContractsBlob,
  Claim,
  Token,
  ClaimPrizeContext,
  GetClaimerProfitablePrizeTxsParams,
  TiersContext,
} from './types';
import {
  logTable,
  logStringValue,
  logBigNumber,
  printAsterisks,
  printSpacer,
  getFeesUsd,
  MARKET_RATE_CONTRACT_DECIMALS,
  getGasTokenMarketRateUsd,
  roundTwoDecimalPlaces,
  parseBigNumberAsFloat,
} from './utils';
import { ERC20Abi } from './abis/ERC20Abi';
import { NETWORK_NATIVE_TOKEN_INFO } from './utils/network';

interface ClaimPrizesParams {
  drawId: string;
  claims: Claim[];
  feeRecipient: string;
}

/**
 * Only claim if we're going to make at least $5.00. This likely should be a config option
 */
const MIN_PROFIT_THRESHOLD_USD = 0.05;

/**
 * Finds all winners for the current draw who have unclaimed prizes and decides if it's profitable
 * to claim for them. The fees the claimer bot can earn increase exponentially over time.
 *
 * @returns {(Promise|undefined)} Promise of an array of ethers PopulatedTransaction objects or undefined
 */
export async function getClaimerProfitablePrizeTxs(
  contracts: ContractsBlob,
  readProvider: Provider,
  params: GetClaimerProfitablePrizeTxsParams,
): Promise<PopulatedTransaction[] | undefined> {
  const { chainId, feeRecipient } = params;

  let transactionsPopulated: PopulatedTransaction[] | undefined = [];

  const contractsVersion = {
    major: 1,
    minor: 0,
    patch: 0,
  };
  const prizePool = getContract('PrizePool', chainId, readProvider, contracts, contractsVersion);
  const claimer = getContract('Claimer', chainId, readProvider, contracts, contractsVersion);
  const marketRate = getContract('MarketRate', chainId, readProvider, contracts, contractsVersion);

  if (!claimer) {
    throw new Error('Claimer: Contract Unavailable');
  }

  // #1. Get context about the prize pool prize token, etc
  const context: ClaimPrizeContext = await getContext(prizePool, marketRate, readProvider);
  printContext(context);

  // #2. Get data about all user's with balances from the subgraph
  printAsterisks();
  console.log(chalk.blue(`2. Subgraph: Getting data ...`));
  const vaults = await getSubgraphVaults(chainId);
  if (vaults.length === 0) {
    throw new Error('Claimer: No vaults found in subgraph');
  }
  console.log(chalk.dim(`${vaults.length} vaults.`));

  // #3. Get more data about which users are winners from the contract
  printAsterisks();
  console.log(chalk.blue(`3. Multicall: Getting vault winners ...`));
  const tiersRangeArray = context.tiers.rangeArray;
  const claims: Claim[] = await getWinnersClaims(readProvider, contracts, vaults, tiersRangeArray, {
    filterAutoClaimDisabled: true,
  });
  logClaims(claims, context);
  console.log(chalk.dim(`${claims.length} prizes.`));
  if (claims.length === 0) {
    console.warn(chalk.yellow(`There are 0 winners in the previous draw. Exiting ...`));

    return transactionsPopulated;
  }

  // #4. Cross-ref other to filter out already claimed prizes
  printAsterisks();
  console.log(chalk.blue(`4. Filtering: Cross-referencing claimed prizes subgraph ...`));
  const drawId = context.drawId.toString();
  const claimedPrizes: ClaimedPrize[] = await getSubgraphClaimedPrizes(chainId, drawId);

  if (claimedPrizes.length === 0) {
    console.log(chalk.dim(`No claimed prizes in subgraph for draw #${drawId}.`));
  } else {
    console.log(chalk.dim(`${claimedPrizes.length} prizes already claimed for draw #${drawId}.`));
  }
  console.log(
    chalk.dim(`${claims.length - claimedPrizes.length} prizes remaining to be claimed...`),
  );

  const filteredClaims: Claim[] = await filterClaimedPrizes(claims, claimedPrizes);

  // #5. Start iterating through vaults
  printAsterisks();
  console.log(chalk.blue(`5. Calculating # of profitable claims ...`));

  // #7. Decide if profitable or not
  const claimPrizesParams = await calculateProfit(
    readProvider,
    chainId,
    contracts,
    claimer,
    filteredClaims,
    feeRecipient,
    marketRate,
    context,
  );
  // It's profitable if there is at least 1 claim to claim
  if (claimPrizesParams.claims.length > 0) {
    console.log(chalk.green('Claimer: Add Populated Claim Tx'));
    // const tx = await claimer.populateTransaction.claimPrizes(...Object.values(claimPrizesParams));
    // transactionsPopulated.push(tx);
  } else {
    console.log(chalk.yellow(`Claimer: Not profitable to claim for Draw #${context.drawId}`));
  }

  return transactionsPopulated;
}

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
  claimer: Contract,
  claims: Claim[],
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

  const { claimCount, claimFees } = await getClaimInfo(claimer, claims);
  console.log('claimCount');
  console.log(claimCount);

  console.log('claimFees');
  console.log(claimFees);

  let claimsSlice;
  let claimPrizesParams;

  try {
    console.log(chalk.bgBlack.cyan(`5a. Gas costs for ${claimCount} claims:`));

    claimsSlice = claims.slice(0, claimCount);
    claimPrizesParams = buildParams(context, claimsSlice, feeRecipient);

    printSpacer();
    const estimatedGasLimit = await getEstimatedGasLimit(claimer, claimPrizesParams);
    if (!estimatedGasLimit || estimatedGasLimit.eq(0)) {
      console.error(chalk.yellow('Estimated gas limit is 0 ...'));
    } else {
      logBigNumber(
        'Estimated gas limit:',
        estimatedGasLimit,
        NETWORK_NATIVE_TOKEN_INFO[chainId].decimals,
        NETWORK_NATIVE_TOKEN_INFO[chainId].symbol,
      );
    }

    const { maxFeeUsd } = await getFeesUsd(
      chainId,
      estimatedGasLimit,
      gasTokenMarketRateUsd,
      readProvider,
    );
    logStringValue(`Max Gas Fee (USD):`, `$${roundTwoDecimalPlaces(maxFeeUsd)}`);

    console.log(chalk.bgBlack.cyan('5b. Profit/Loss (USD):'));
    printSpacer();

    // Get the exact amount of fees we'll get back
    let totalFees;
    try {
      const staticResult = await claimer.callStatic.claimPrizes(
        ...Object.values(claimPrizesParams),
      );
      totalFees = staticResult.totalFees;
    } catch (e) {
      throw new Error(e);
    }

    // FEES USD
    const totalFeesUsd =
      parseFloat(ethers.utils.formatUnits(totalFees, context.feeToken.decimals)) *
      context.feeTokenRateUsd;
    logBigNumber(
      'TotalFees:',
      totalFees.toString(),
      context.feeToken.decimals,
      context.feeToken.symbol,
    );
    console.log(chalk.green('TotalFees:', `$${roundTwoDecimalPlaces(totalFeesUsd)}`));

    printSpacer();

    const netProfitUsd = totalFeesUsd - maxFeeUsd;
    console.log(chalk.magenta('Net profit = (Earned fees - Gas [Max])'));
    console.log(
      chalk.greenBright(
        `$${roundTwoDecimalPlaces(netProfitUsd)} = ($${roundTwoDecimalPlaces(
          totalFeesUsd,
        )} - $${roundTwoDecimalPlaces(maxFeeUsd)})`,
      ),
    );
    printSpacer();

    const profitable = netProfitUsd > MIN_PROFIT_THRESHOLD_USD;
    logTable({
      MIN_PROFIT_THRESHOLD_USD: `$${MIN_PROFIT_THRESHOLD_USD}`,
      'Net profit (USD)': `$${roundTwoDecimalPlaces(netProfitUsd)}`,
      'Profitable?': profitable ? '✔' : '✗',
    });
    printSpacer();

    if (!profitable) {
      console.log(chalk.yellow(`Claiming ${claimCount} claim(s) is currently not profitable:`));
    }
  } catch (e) {
    console.log(chalk.yellow(`Error for ${claimCount} prize claim(s).`));
  } finally {
    if (claimCount > 0) {
      console.log(chalk.yellow(`Submitting transaction to claim ${claimCount} prize(s).`));
    } else {
      console.log(chalk.yellow(`Unable to submit any optimal, profitable transactions.`));
    }
  }

  if (claimCount !== 0) {
    claimsSlice = claims.slice(0, claimCount);
    claimPrizesParams = buildParams(context, claimsSlice, feeRecipient);
  }

  return claimPrizesParams;
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
  const rangeArray = Array.from({ length: numberOfTiers + 1 }, (value, index) => index);
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

const logClaims = (claims: Claim[], context: ClaimPrizeContext) => {
  const tiersArray = context.tiers.rangeArray;

  let tierClaimsFiltered: { [index: number]: Claim[] } = {};
  tiersArray.forEach((tierNum) => {
    tierClaimsFiltered[tierNum] = claims.filter((claim) => claim.tier === tierNum);
  });

  tiersArray.forEach((tierNum) => {
    const tierClaims = tierClaimsFiltered[tierNum];
    const tierWord = tiersArray.length - 1 === tierNum ? `${tierNum} (canary)` : `${tierNum}`;
    console.table({ Tier: { '#': tierWord, '# of Winners': tierClaims.length } });
  });
};

const filterClaimedPrizes = (claims: Claim[], claimedPrizes: ClaimedPrize[]): Claim[] => {
  const formattedClaimedPrizes = claimedPrizes.map((claimedPrize) => {
    // From Subgraph, `id` is:
    // vault ID + winner ID + draw ID + tier
    const [vault, winner, draw, tier] = claimedPrize.id.split('-');
    return `${vault}-${winner}-${tier}`;
  });

  return claims.filter(
    (claim) => !formattedClaimedPrizes.includes(`${claim.vault}-${claim.winner}-${claim.tier}`),
  );
};

const buildParams = (
  context: ClaimPrizeContext,
  claims: Claim[],
  feeRecipient: string,
): ClaimPrizesParams => {
  return {
    drawId: context.drawId,
    claims,
    feeRecipient,
  };
};

interface ClaimInfo {
  claimCount: number;
  claimFees: BigNumber;
}

const getClaimInfo = async (claimer: Contract, claims: Claim[]): Promise<ClaimInfo> => {
  const GAS_USAGE_PER_CLAIM = 200000;
  const GAS_PRICE_IN_PRIZE_TOKENS = 3;
  const claimCost = GAS_USAGE_PER_CLAIM * GAS_PRICE_IN_PRIZE_TOKENS;

  let claimCount = 0;
  let claimFees = BigNumber.from(0);
  for (let numClaims = 1; numClaims < claims.length; numClaims++) {
    const nextClaimFees = await claimer.computeTotalFees(numClaims);
    if (nextClaimFees.sub(claimFees).gt(claimCost)) {
      claimCount = numClaims;
      claimFees = nextClaimFees;
    } else {
      break;
    }
  }

  return { claimCount, claimFees };
};
