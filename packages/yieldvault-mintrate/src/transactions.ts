import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  runYieldVaultHandleMintRate,
  YieldVaultMintRateConfig,
} from '@generationsoftware/pt-v5-autotasks-library';
import fetch from 'node-fetch';

export async function processTransactions(config: YieldVaultMintRateConfig): Promise<void> {
  const { chainId } = config;
  const contracts: ContractsBlob = await downloadContractsBlob(chainId, fetch);
  await runYieldVaultHandleMintRate(contracts, config);
}
