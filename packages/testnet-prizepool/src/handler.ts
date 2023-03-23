import { Relayer, RelayerParams } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import {
  testnetContractsBlob as contracts,
  testnetPrizePoolHandleCompletePrize,
  ContractsBlob,
  isMainnet,
  isTestnet,
  getContract,
  getContracts,
} from '@pooltogether/v5-autotasks-library';
// import { mainnet, testnet } from '@pooltogether/v5-pool-data';

// const getContracts = (chainId: number): ContractsBlob => {
//   if (isMainnet(chainId)) {
//     return mainnet;
//   } else if (isTestnet(chainId)) {
//     return testnet;
//   } else {
//     throw new Error('Unsupported network or CHAIN_ID env variable is missing');
//   }
// };

export async function handler(event: RelayerParams) {
  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: 'fast' });
  const relayer = new Relayer(event);

  const chainId = Number(process.env.CHAIN_ID);
  // const contracts = getContracts(chainId);
  const c = getContract('PrizePool', chainId, provider, contracts);
  const cs = getContracts('PrizePool', chainId, provider, contracts);

  try {
    const transactionPopulated = await testnetPrizePoolHandleCompletePrize(contracts, {
      chainId,
      provider: signer,
    });

    if (transactionPopulated) {
      let transactionSentToNetwork = await relayer.sendTransaction({
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 200000,
      });
      console.log('TransactionHash:', transactionSentToNetwork.hash);
    } else {
      console.log('TestNet PrizPool: Transaction not populated');
    }
  } catch (error) {
    throw new Error(error);
  }
}
