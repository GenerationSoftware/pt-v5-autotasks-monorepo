import { BigNumber, ethers } from 'ethers';
import { Contract } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';

import { LiquidationPairAbi } from '../abis/LiquidationPairAbi.js';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Uses multicall to check the exact amount in for multiple amount out values
 *
 * @param liquidationPairFactoryContract ethers contract instance of the TpdaLiquidationPairFactory to query
 * @param provider provider for the chain that will be queried
 * @returns
 */
export const getLiquidationPairComputeExactAmountInMulticall = async (
  liquidationPairContract: Contract,
  wantedAmountsOut: BigNumber[],
  provider: Provider,
): Promise<BigNumber[]> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

  let queries: Record<string, any> = {};

  let wantedAmountsIn: BigNumber[] = [];

  // Queries:
  const liquidationPairMulticallContract = new ethers.Contract(
    liquidationPairContract.address,
    LiquidationPairAbi,
    multicallProvider,
  );

  // Queries
  for (let i = 0; i < wantedAmountsOut.length; i++) {
    const amountOut = wantedAmountsOut[i];
    queries[`computeExactAmountIn-${i}`] =
      liquidationPairMulticallContract.callStatic.computeExactAmountIn(amountOut);
  }

  // Get and process results:
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  for (let i = 0; i < wantedAmountsOut.length; i++) {
    const amountIn = results[`computeExactAmountIn-${i}`];
    wantedAmountsIn.push(amountIn);
  }

  return wantedAmountsIn;
};
