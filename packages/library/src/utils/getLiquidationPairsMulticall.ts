import { ethers, Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import {
  ContractsBlob,
  getEthersMulticallProviderResults,
} from '@generationsoftware/pt-v5-utils-js';

import { TpdaLiquidationPairAbi } from '../abis/TpdaLiquidationPairAbi.js';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Uses multicall to get Ethers Contract instances for every LiquidationPair created by a specific
 * LiquidationPairFactory
 *
 * @param liquidationPairFactoryContract ethers contract instance of the LiquidationPairFactory to query
 * @param provider provider for the chain that will be queried
 * @returns
 */
export const getLiquidationPairsMulticall = async (
  liquidationPairFactoryContract: Contract,
  contracts: ContractsBlob,
  provider: Provider,
): Promise<Contract[]> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

  let queries: Record<string, any> = {};

  let liquidationPairContracts: Contract[] = [];

  // Queries:
  const numPairs = await liquidationPairFactoryContract.totalPairs();

  const liquidationPairFactoryContractBlob = contracts.contracts.find(
    (contract) => contract.type === 'TpdaLiquidationPairFactory',
  );

  const liquidationPairFactoryMulticallContract = new ethers.Contract(
    liquidationPairFactoryContract.address,
    liquidationPairFactoryContractBlob.abi,
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
      TpdaLiquidationPairAbi,
      multicallProvider,
    );
    liquidationPairContracts.push(liquidationPairContract);
  }

  return liquidationPairContracts;
};
