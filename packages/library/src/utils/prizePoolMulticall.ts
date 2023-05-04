import { providers } from "ethers";
import { ContractCallContext } from "ethereum-multicall";

import { Claim, ClaimPrizeContext, ContractsBlob, Vault } from "../types";
import { getComplexMulticallResults } from "../utils";

/**
 * Returns claims
 * @param readProvider a read-capable provider for the chain that should be queried
 * @param contracts blob of contracts to pull PrizePool abi/etc from
 * @param vaults vaults to query through
 * @param tiersArray an easily iterable range of numbers for each tier available (ie. [0, 1, 2])
 * @returns
 */
export const getWinners = async (
  readProvider: providers.Provider,
  contracts: ContractsBlob,
  vaults: Vault[],
  context: ClaimPrizeContext
): Promise<Claim[]> => {
  const tiersArray = context.tiers.rangeArray;

  const prizePoolContractBlob = contracts.contracts.find(contract => contract.type === "PrizePool");

  const calls: ContractCallContext["calls"] = [];

  vaults.forEach(vault => {
    vault.accounts.forEach(account => {
      const address = account.id.split("-")[1];

      tiersArray.forEach(tierNum => {
        calls.push({
          reference: `${vault.id}-${address}-${tierNum}`,
          methodName: "isWinner",
          methodParameters: [vault.id, address, tierNum]
        });
      });
    });
  });

  const prizePoolAddress = prizePoolContractBlob.address;

  const queries: ContractCallContext[] = [
    {
      reference: prizePoolAddress,
      contractAddress: prizePoolAddress,
      abi: prizePoolContractBlob.abi,
      calls
    }
  ];

  const multicallResults = await getComplexMulticallResults(readProvider, queries);

  // Builds the array of claims
  return getClaims(prizePoolAddress, multicallResults, context);
};

const getClaims = (
  prizePoolAddress: string,
  multicallResults,
  context: ClaimPrizeContext
): Claim[] => {
  const claims: Claim[] = [];

  Object.entries(multicallResults[prizePoolAddress]).forEach(vaultUserTierResult => {
    const key = vaultUserTierResult[0];
    const value = vaultUserTierResult[1];
    const isWinner = value[0];

    const [vault, winner, tier] = key.split("-");

    if (isWinner) {
      claims.push({ vault, tier: Number(tier), winner });
    }
  });

  logClaims(claims, context);

  return claims;
};

const logClaims = (claims: Claim[], context: ClaimPrizeContext) => {
  const tiersArray = context.tiers.rangeArray;

  let tierClaimsFiltered = {};
  tiersArray.forEach(tierNum => {
    tierClaimsFiltered[tierNum] = claims.filter(claim => claim.tier === tierNum);
  });

  tiersArray.forEach(tierNum => {
    const tierClaims = tierClaimsFiltered[tierNum];
    const tierWord = tiersArray.length - 1 === tierNum ? `${tierNum} (canary)` : `${tierNum}`;
    console.table({ Tier: { "#": tierWord, "# of Winners": tierClaims.length } });
  });
};
