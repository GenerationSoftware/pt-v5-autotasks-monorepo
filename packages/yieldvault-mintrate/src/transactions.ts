import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  runYieldVaultHandleMintRate,
  YieldVaultMintRateConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import fetch from 'node-fetch';

export async function processTransactions(
  yieldVaultMintRateConfigParams: YieldVaultMintRateConfigParams,
): Promise<void> {
  const { chainId } = yieldVaultMintRateConfigParams;
  const contracts: ContractsBlob = await downloadContractsBlob(chainId, fetch);
  await runYieldVaultHandleMintRate(contracts, yieldVaultMintRateConfigParams);
}
