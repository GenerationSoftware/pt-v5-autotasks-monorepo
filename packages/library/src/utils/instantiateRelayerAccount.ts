import { Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Relayer, RelayerParams } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';
import { RelayerAccount } from '../types';

// Takes a generic set of providers, the lambda event params (in the case of an OZ Defender setup),
// and an optional EOA private key and creates a RelayerAccount
export const instantiateRelayerAccount = async (
  writeProvider: DefenderRelayProvider | Provider,
  readProvider: DefenderRelayProvider | Provider,
  event: RelayerParams | Relayer,
  customRelayerPrivateKey?: string,
): Promise<RelayerAccount> => {
  let signer, relayerAddress, relayer;
  if (customRelayerPrivateKey) {
    const wallet = new Wallet(customRelayerPrivateKey, readProvider);

    relayerAddress = wallet.address;
    relayer = wallet;
    signer = wallet;
  } else {
    const signer = new DefenderRelaySigner(event, writeProvider, {
      speed: 'fast',
    });
    relayerAddress = await signer.getAddress();
    relayer = signer;
  }

  return { signer, relayer, relayerAddress };
};
