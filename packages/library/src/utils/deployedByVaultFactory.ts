import { Provider } from '@ethersproject/providers';
import { Contract } from 'ethers';

import { VaultFactoryAbi } from '../abis/VaultFactoryAbi';
import { CHAIN_IDS } from './network';

const VAULT_FACTORY_V1_ADDRESSES = {
  [CHAIN_IDS.optimism]: ['0xF65FA202907D6046D1eF33C521889B54BdE08081'],
};
const VAULT_FACTORY_V2_ADDRESSES = {
  [CHAIN_IDS.optimism]: ['0x6b17ee3a95bccd605340454c5919e693ef8eff0e'],
};

export const deployedByVaultFactory = async (
  l1Provider: Provider,
  chainId: number,
  address: string,
): Promise<boolean> => {
  let vaultFactoryContracts = [];

  for (let vaultFactoryAddress of VAULT_FACTORY_V1_ADDRESSES[chainId]) {
    vaultFactoryContracts.push(new Contract(vaultFactoryAddress, VaultFactoryAbi, l1Provider));
  }
  for (let vaultFactoryAddress of VAULT_FACTORY_V2_ADDRESSES[chainId]) {
    vaultFactoryContracts.push(new Contract(vaultFactoryAddress, VaultFactoryAbi, l1Provider));
  }

  for (let vaultFactoryContract of vaultFactoryContracts) {
    const deployedByVault = await vaultFactoryContract.deployedVaults(address);

    if (deployedByVault) {
      return true;
    }
  }

  return false;
};
