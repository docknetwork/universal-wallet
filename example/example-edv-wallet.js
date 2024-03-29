/*
  EDVWallet interop example
*/
import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import { getKeypairFromDoc } from '../src/methods/keypairs';
import EDVWallet from '../src/edv-wallet';

import {
  KEY_KAK,
  KEY_LOCAL,
} from '../tests/constants/keys';
import MockHmac from '../tests/mock/hmac';

import useStorageWallet from './use-storage-wallet';

import { X25519KeyAgreementKey2020 } from '@digitalbazaar/x25519-key-agreement-key-2020';

/**
  Currently this example requires that you run a secure data vault server locally
* */
async function main() {
  // Get mock keys
  // Ideally you would use a key management system
  // See readme for more: https://github.com/digitalbazaar/edv-client
  const hmac = await MockHmac.create(); // TODO: replace mock example with actual crypto classes
  const keyAgreementKey = await X25519KeyAgreementKey2020.from(KEY_KAK);
  const keys = {
    keyAgreementKey,
    hmac,
  };
  console.log('Using keys:', keys);

  const { controller } = KEY_LOCAL;
  const invocationSigner = getKeypairFromDoc(KEY_LOCAL); // hacky mock signer
  invocationSigner.sign = invocationSigner.signer().sign;

  // Creating the EDV is considered out of band for the EDVWallet class, so we do it here through the storage interface
  // in a real world scenario, the creation may be done differently or require payment
  const storageInterface = new EDVHTTPStorageInterface({
    url: 'http://localhost:8080',
    invocationSigner,
    keys,
  });

  let walletId;
  const existingConfig = await storageInterface.findConfigFor(controller);
  if (!existingConfig) {
    console.log('Creating new wallet EDV');
    walletId = await storageInterface.createEdv({
      sequence: 0, // on init the sequence must be 0 and is required
      referenceId: 'primary',
      controller,
    });
  } else {
    walletId = existingConfig.id;
    console.log('Found existing wallet EDV');
  }

  // Create a wallet instance for this EDV/wallet ID
  console.log('Loading remote EDV wallet:', walletId);
  const edvWallet = new EDVWallet(walletId, {
    keys,
    invocationSigner,
  });

  await useStorageWallet(edvWallet);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
