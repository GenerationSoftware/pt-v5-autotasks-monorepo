import { ethers } from 'ethers';
import { Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';

import { LiquidationPairAbi } from '../abis/LiquidationPairAbi';
import { LiquidationPairFactoryAbi } from '../abis/LiquidationPairFactoryAbi';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Uses multicall to get Ethers Contract instances for every LiquidationPair created by a specific
 * LiquidationPairFactory
 *
 * @param liquidationPairFactoryContract ethers contract instance of the LiquidationPairFactory to query
 * @param l1Provider provider for the chain that will be queried
 * @returns
 */
export const getLiquidationPairsMulticall = async (
  liquidationPairFactoryContract: Contract,
  l1Provider: Provider,
): Promise<Contract[]> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(l1Provider);

  let queries: Record<string, any> = {};

  let liquidationPairContracts: Contract[] = [];

  // Queries:
  const numPairs = await liquidationPairFactoryContract.totalPairs();
  const liquidationPairFactoryMulticallContract = new ethers.Contract(
    liquidationPairFactoryContract.address,
    LiquidationPairFactoryAbi,
    multicallProvider,
  );

  for (let i = 0; i < numPairs; i++) {
    queries[`allPairs-${i}`] = liquidationPairFactoryMulticallContract.allPairs(i);
  }

  // Get and process results:
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  for (let i = 0; i < numPairs; i++) {
    const liquidationPair = results[`allPairs-${i}`];
    const liquidationPairContract = new ethers.Contract(
      liquidationPair,
      LiquidationPairAbi,
      multicallProvider,
    );
    liquidationPairContracts.push(liquidationPairContract);
  }

  return liquidationPairContracts;
};
