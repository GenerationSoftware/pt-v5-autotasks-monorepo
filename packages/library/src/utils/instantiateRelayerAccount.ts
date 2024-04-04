import { Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { RelayerAccount } from '../types.js';

// Takes a generic set of providers and a EOA private key and creates a RelayerAccount
export const instantiateRelayerAccount = async (
  provider: Provider,
  customRelayerPrivateKey: string,
): Promise<RelayerAccount> => {
  let wallet, signer, relayerAddress, ozRelayer;

  wallet = new Wallet(customRelayerPrivateKey, provider);
  relayerAddress = wallet.address;
  signer = wallet;

  return { wallet, signer, ozRelayer, relayerAddress };
};
