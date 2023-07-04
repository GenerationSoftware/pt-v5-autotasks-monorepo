import { PopulatedTransaction } from '@ethersproject/contracts';
import { RelayerParams } from 'defender-relay-client';
import { downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import {
  executeClaimerProfitablePrizeTxs,
  PrizeClaimerConfigParams,
  FLASHBOTS_SUPPORTED_CHAINS,
  ExecuteClaimerProfitablePrizeTxsParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import { Relayer } from 'defender-relay-client';
import chalk from 'chalk';
import { Provider } from '@ethersproject/abstract-provider';

export const executeTransactions = async (
  event: RelayerParams,
  readProvider: Provider,
  params: ExecuteClaimerProfitablePrizeTxsParams,
): Promise<PopulatedTransaction[]> => {
  let populatedTxs: PopulatedTransaction[] = [];

  const relayer = new Relayer(event);

  try {
    const contracts = await downloadContractsBlob(params.chainId);
    await executeClaimerProfitablePrizeTxs(contracts, relayer, readProvider, params);
  } catch (e) {
    console.error(e);
  }

  return populatedTxs;
};

export const processPopulatedTransactions = async (
  event: RelayerParams,
  populatedTxs: PopulatedTransaction[],
  params: PrizeClaimerConfigParams,
) => {
  const { chainId } = params;
  const relayer = new Relayer(event);

  try {
    if (populatedTxs.length > 0) {
      const chainSupportsFlashbots = FLASHBOTS_SUPPORTED_CHAINS.includes(chainId);

      for (const populatedTx of populatedTxs) {
        let transactionSentToNetwork = await relayer.sendTransaction({
          isPrivate: chainSupportsFlashbots && params.useFlashbots,
          data: populatedTx.data,
          to: populatedTx.to,
          gasLimit: 6000000,
        });
        console.log(chalk.greenBright.bold('Transaction sent! ✔'));
        console.log(chalk.blueBright.bold('Transaction hash:', transactionSentToNetwork.hash));
      }
    } else {
      console.log('Claimer: No transactions populated');
    }
  } catch (error) {
    throw new Error(error);
  }
};
