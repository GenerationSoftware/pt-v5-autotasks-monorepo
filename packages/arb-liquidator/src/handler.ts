import { Relayer } from "defender-relay-client";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import {
  liquidatorHandleArbSwap,
  ContractsBlob,
  testnetContractsBlob as contracts,
  // isMainnet,
  // isTestnet,
} from "@pooltogether/v5-autotasks-library";
import chalk from "chalk";
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
// replace with method above when lib is published
// const contracts: ContractsBlob = {};

export async function handler(event) {
  console.clear();

  const provider = new DefenderRelayProvider(event);
  const signer = new DefenderRelaySigner(event, provider, { speed: "fast" });
  const relayer = new Relayer(event);

  const chainId = Number(process.env.CHAIN_ID);

  // TODO: Add a secrets lookup fxn based on chainId:
  const relayerAddress = process.env.RELAYER_ADDRESS || event.secrets.arbGoerliRelayerAddress;
  const swapRecipient = process.env.SWAP_RECIPIENT || event.secrets.arbGoerliSwapRecipient;

  // const contracts = getContracts(chainId);

  try {
    const transactionPopulated = await liquidatorHandleArbSwap(
      contracts,
      {
        chainId,
        provider: signer,
      },
      relayerAddress,
      swapRecipient
    );

    if (transactionPopulated) {
      let transactionSentToNetwork = await relayer.sendTransaction({
        data: transactionPopulated.data,
        to: transactionPopulated.to,
        gasLimit: 800000,
      });
      console.log(chalk.green("Transaction sent! ✓"));
      console.log(chalk.green("Transaction hash:", transactionSentToNetwork.hash));
    } else {
      console.log(chalk.red("LiquidationPair: Transaction not populated"));
    }
  } catch (error) {
    throw new Error(error);
  }
}
