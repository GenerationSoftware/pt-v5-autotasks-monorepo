import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  runYieldVaultMintRate,
  YieldVaultMintRateConfig,
} from '@generationsoftware/pt-v5-autotasks-library';
import fetch from 'node-fetch';

export async function executeTransactions(config: YieldVaultMintRateConfig): Promise<void> {
  try {
    const { chainId } = config;
    const contracts: ContractsBlob = await downloadContractsBlob(chainId, fetch);
    await runYieldVaultMintRate(contracts, config);
  } catch (e) {
    console.error(e);
  }
}
