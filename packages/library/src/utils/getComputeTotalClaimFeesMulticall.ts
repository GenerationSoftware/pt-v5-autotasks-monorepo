import { Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Uses multicall to find how much we can earn for claim fees for a range of claims (ie 1, 2, 3 ... 50)
 * ClaimContract
 *
 * @param tier which tier we're querying against
 * @param claimerContract ethers contract instance of the Claimer contract to query
 * @param provider provider for the chain that will be queried
 * @returns
 */
export const getComputeTotalClaimFeesMulticall = async (
  tier: number,
  numClaims: number,
  claimerContract: Contract,
  provider: Provider,
): Promise<Record<string, any>> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

  let queries: Record<string, any> = {};
  for (let x = 1; x <= numClaims; x++) {
    queries[x.toString()] = claimerContract.functions['computeTotalFees(uint8,uint256)'](tier, x);
  }

  return await getEthersMulticallProviderResults(multicallProvider, queries);
};
