import { Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { Relayer } from 'defender-relay-client';
import { DefenderRelayProvider, DefenderRelaySigner } from 'defender-relay-client/lib/ethers';

import { RelayerAccount } from '../types';

// Takes a generic set of providers, the lambda event params (in the case of an OZ Defender setup),
// and an optional EOA private key and creates a RelayerAccount
export const instantiateRelayerAccount = async (
  l1Provider: DefenderRelayProvider | Provider,
  event,
  customRelayerPrivateKey?: string,
): Promise<RelayerAccount> => {
  let wallet, signer, relayerAddress, ozRelayer;

  if (customRelayerPrivateKey) {
    wallet = new Wallet(customRelayerPrivateKey, l1Provider);
    relayerAddress = wallet.address;
    signer = wallet;
  } else {
    signer = new DefenderRelaySigner(event, l1Provider, {
      speed: 'fast',
    });
    relayerAddress = await signer.getAddress();
    ozRelayer = new Relayer(event);
  }

  return { wallet, signer, ozRelayer, relayerAddress };
};
