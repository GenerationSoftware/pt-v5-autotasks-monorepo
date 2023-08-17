import esMain from 'es-main';
import Configstore from 'configstore';
import figlet from 'figlet';
import chalk from 'chalk';
import { ethers } from 'ethers';
import {
  liquidatorArbitrageSwap,
  ArbLiquidatorConfigParams,
} from '@generationsoftware/pt-v5-autotasks-library';
import { ContractData, downloadContractsBlob } from '@generationsoftware/pt-v5-utils-js';
import { Relayer } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

import { askQuestions } from './helpers/questions';

import pkg from '../package.json';

console.log(chalk.magenta(figlet.textSync('PoolTogether')));
console.log(chalk.blue(figlet.textSync('Arb Liquidator Bot')));

if (esMain(import.meta)) {
  const config = await askQuestions(new Configstore(pkg.name));

  const fakeEvent = {
    apiKey: config.RELAYER_API_KEY,
    apiSecret: config.RELAYER_API_SECRET,
  };
  const relayer = new Relayer(fakeEvent);
  const provider = new DefenderRelayProvider(fakeEvent);
  const signer = new DefenderRelaySigner(fakeEvent, provider, {
    speed: 'fast',
  });
  const relayerAddress = await signer.getAddress();

  const params: ArbLiquidatorConfigParams = {
    relayerAddress,
    writeProvider: signer,
    readProvider: new ethers.providers.JsonRpcProvider(config.JSON_RPC_URI, config.CHAIN_ID),
    covalentApiKey: config.COVALENT_API_KEY,
    chainId: config.CHAIN_ID,
    swapRecipient: config.SWAP_RECIPIENT,
    useFlashbots: config.USE_FLASHBOTS,
    minProfitThresholdUsd: Number(config.MIN_PROFIT_THRESHOLD_USD),
  };

  // TODO: Simply use the populate/processPopulatedTransactions pattern here as well
  try {
    const contracts = await downloadContractsBlob(config.CHAIN_ID);

    // await drip(contracts, signer);

    await liquidatorArbitrageSwap(contracts, relayer, params);
  } catch (error) {
    throw new Error(error);
  }
}

export function main() {}

async function drip(contracts, signer) {
  // Faucet
  const faucetContractData = contracts.contracts.find(
    (contract) => contract.type === 'TokenFaucet',
  );
  const faucetContract = new ethers.Contract(
    '0xcb0a8a7a1d37e35881461a3971148dd432746401',
    faucetContractData.abi,
    signer,
  );
  const poolTokenAddress = '0x68A100A3729Fc04ab26Fb4C0862Df22CEec2f18B';
  const tx = await faucetContract.drip(poolTokenAddress);
  console.log(tx.hash);
  // Faucet
}
