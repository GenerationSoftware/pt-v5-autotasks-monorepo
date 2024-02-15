import { ethers } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { getEthersMulticallProviderResults } from '@generationsoftware/pt-v5-utils-js';
import { ContractsBlob, Vault } from '@generationsoftware/pt-v5-utils-js';

import { VaultWithContext } from '../../src/types';

import ethersMulticallProviderPkg from 'ethers-multicall-provider';
const { MulticallWrapper } = ethersMulticallProviderPkg;

/**
 * Uses multicall to gather information about each vault
 *
 * @param populatedVaults vaults with a vaultContract ethers Contract initialized
 * @param provider provider for the chain that will be queried
 * @returns
 */
export const getVaultsWithContextMulticall = async (
  vaults: Vault[],
  provider: Provider,
  contracts: ContractsBlob,
): Promise<VaultWithContext[]> => {
  // @ts-ignore Provider == BaseProvider
  const multicallProvider = MulticallWrapper.wrap(provider);

  let queries: Record<string, any> = {};

  // Get Vault ABI
  const vaultContractData = contracts.contracts.find((contract) => contract.type === 'Vault');

  let populatedVaults: VaultWithContext[] = [];
  for (let vault of vaults) {
    const vaultContract = new ethers.Contract(vault.id, vaultContractData.abi, multicallProvider);

    const vaultPopulated: VaultWithContext = { id: vault.id, vaultContract };

    // Queries:
    queries[`vault-${vault.id}-asset`] = vaultContract.asset();
    queries[`vault-${vault.id}-liquidationPair`] = vaultContract.liquidationPair();

    populatedVaults.push(vaultPopulated);
  }

  // Get and process results:
  const results = await getEthersMulticallProviderResults(multicallProvider, queries);

  for (let populatedVault of populatedVaults) {
    populatedVault.asset = results[`vault-${populatedVault.id}-asset`];
    populatedVault.liquidationPair = results[`vault-${populatedVault.id}-liquidationPair`];
  }

  return populatedVaults;
};
