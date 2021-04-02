/*
  EDVWallet interop example
*/
import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import { getKeypairFromDoc } from '../src/methods/keypairs';
import EDVWallet from '../src/edv-wallet';

import keyBase58 from '../tests/constants/keys/key-base58.json';
import MockHmac from '../tests/mock/hmac';
import MockKak from '../tests/mock/kak';

import useStorageWallet from './use-storage-wallet';

/**
  Currently this example requires that you run a secure data vault server locally
  and have a pre-created EDV for now (need to expand this later)
**/
async function main() {
  // Get mock keys
  // Ideally you would use a key management system
  // See readme for more: https://github.com/digitalbazaar/edv-client
  const hmac = await MockHmac.create(); // TODO: replace mock example with actual crypto classes
  const keyAgreementKey = new MockKak(); // TODO: replace mock example with actual crypto classes
  const keys = {
    keyAgreementKey,
    hmac,
  };
  console.log('Using keys:', keys)

  const { controller } = keyBase58;
  const capability = undefined; // use defaults
  const invocationSigner = getKeypairFromDoc(keyBase58); // hacky mock signer
  invocationSigner.sign = invocationSigner.signer().sign;

  // TODO: some way to create a new wallet on the vault. this assumes an EDV exists with id below
  // i feel like edv creation should be out of band of wallet class
  const walletId = 'http://localhost:8080/edvs/z1A8cpoziZJcdnsVeoTPTfrXP';
  console.log('Loading remote EDV wallet:', walletId);

  // Create a wallet instance for this EDV/wallet ID
  const edvWallet = new EDVWallet(walletId, {
    keys,
    invocationSigner,
    capability,
  });

  await useStorageWallet(edvWallet);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
