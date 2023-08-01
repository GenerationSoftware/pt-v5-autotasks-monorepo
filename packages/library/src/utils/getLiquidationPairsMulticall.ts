import { Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';

import { LiquidationPairAbi } from '../abis/LiquidationPairAbi';
import { LiquidationPairFactoryAbi } from '../abis/LiquidationPairFactoryAbi';

import { ethers } from 'ethers';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Uses multicall to get Ethers Contract instances for every LiquidationPair created by a specific
 * LiquidationPairFactory
 *
 * @param liquidationPairFactory ethers contract instance of the LiquidationPairFactory to query
 * @param readProvider a read-capable provider for the chain that should be queried
 * @returns
 */
export const getLiquidationPairsMulticall = async (
  liquidationPairFactory: Contract,
  readProvider: Provider,
): Promise<Contract[]> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(readProvider);

  let queries: Record<string, any> = {};

  let liquidationPairContracts: Contract[] = [];

  // Queries:
  const numPairs = await liquidationPairFactory.totalPairs();
  const liquidationPairFactoryMulticallContract = new ethers.Contract(
    liquidationPairFactory.address,
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
