import { Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { RelayerAccount } from '../types.js';

// Takes a generic set of providers and a EOA private key and creates a RelayerAccount
export const instantiateRelayerAccount = async (
  provider: Provider,
  customRelayerPrivateKey: string,
): Promise<RelayerAccount> => {
  let wallet, signer, relayerAddress, ozRelayer;

  console.log(customRelayerPrivateKey);
  console.log(provider);

  wallet = new Wallet(customRelayerPrivateKey, provider);
  console.log(wallet);

  relayerAddress = wallet.address;
  signer = wallet;

  return { wallet, signer, ozRelayer, relayerAddress };
};
