import chalk from 'chalk';
import { Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Relayer, RelayerParams } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { RelayerAccount } from '../types';
import { printSpacer } from './logging';

// Takes a generic set of providers, the lambda event params (in the case of an OZ Defender setup),
// and an optional EOA private key and creates a RelayerAccount
export const instantiateRelayerAccount = async (
  writeProvider: DefenderRelayProvider | Provider,
  readProvider: DefenderRelayProvider | Provider,
  event,
  customRelayerPrivateKey?: string,
): Promise<RelayerAccount> => {
  let wallet, signer, relayerAddress, ozRelayer;

  // if (!customRelayerPrivateKey && (!event.apiKey || !event.apiSecret)) {
  //   console.log(
  //     chalk.yellow(
  //       'Missing private key or OZ Defender relayer auth credentials, are env vars (local) or secrets (remote) set and exported properly?',
  //     ),
  //   );
  //   printSpacer();
  //   printSpacer();
  // }

  if (customRelayerPrivateKey) {
    wallet = new Wallet(customRelayerPrivateKey, readProvider);
    relayerAddress = wallet.address;
    signer = wallet;
  } else {
    signer = new DefenderRelaySigner(event, writeProvider, {
      speed: 'fast',
    });
    relayerAddress = await signer.getAddress();
    ozRelayer = new Relayer(event);
  }

  return { wallet, signer, ozRelayer, relayerAddress };
};
