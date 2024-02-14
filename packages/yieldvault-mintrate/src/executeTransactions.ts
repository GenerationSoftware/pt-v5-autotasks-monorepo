import nodeFetch from 'node-fetch';
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  runYieldVaultMintRate,
  YieldVaultMintRateConfig,
} from '@generationsoftware/pt-v5-autotasks-library';

export async function executeTransactions(config: YieldVaultMintRateConfig): Promise<void> {
  try {
    const { chainId } = config;
    const contracts: ContractsBlob = await downloadContractsBlob(
      chainId,
      config.contractVersion,
      nodeFetch,
    );
    await runYieldVaultMintRate(contracts, config);
  } catch (e) {
    console.error(e);
  }
}
