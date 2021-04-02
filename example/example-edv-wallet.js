/*
  EDV HTTP Storage Interface Example -> DockWallet interop example
*/


  // TODO: create secure storage vault instance
  // somehow able to load wallet contents
  // do we query for all contents at the start and load into the wallet?
  // eg: wallet.import(await getWalletCred(), password);

/*
  EDV HTTP Storage Interface Example
*/
import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import EDVWallet from '../src/edv-wallet';
import { getKeypairFromDoc } from '../src/methods/keypairs';
// import keyAgreementKeyJSON from '../tests/constants/keys/key-agreement-key.json';
import keyBase58 from '../tests/constants/keys/key-base58.json';
import MockHmac from '../tests/mock/hmac';
import MockKak from '../tests/mock/kak';

import {
  WALLET_CONTENT_ITEM,
} from '../tests/constants';

/**
  Currently this example requires that you run a secure data vault server locally
  Idea of a flow:
    One document in EDV = One document in the wallet
    Document capabilities can be different depending
    Would need a way to search documents in the EDV
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
  // console.log('Using keys:', keys)

  const { controller } = keyBase58;
  const capability = undefined; // use defaults
  const invocationSigner = getKeypairFromDoc(keyBase58); // hacky mock signer
  invocationSigner.sign = invocationSigner.signer().sign;

  const walletId = 'http://localhost:8080/edvs/z19triBXWGLzhY7M9sPViDz97';
  console.log('Loading remote EDV wallet:', walletId);

  // TODO: some way to create a new wallet on the vault. this assumes an EDV exists with id below
  // wallet contents are loaded automatically, perhaps we should provide options on how to query or load them
  const edvWallet = new EDVWallet(walletId, {
    keys,
    invocationSigner,
    capability,
    // referenceId: 'primary',
  });

  // Add basic wallet contents
  if (edvWallet.contents.length === 0) {
    console.log('Wallet has no documents, adding some...');

    // Add a credential
    edvWallet.add(WALLET_CONTENT_ITEM);

    // TODO: add keys

    // Call optional sync method to ensure our storage promises
    // have succeeded and completed
    await edvWallet.sync();

    console.log('Wallet contents have been saved to the remote EDV, total:', edvWallet.contents.length);
    console.log('Run the example again to see contents loaded from the EDV');
  } else {
    console.log('Wallet contents have been loaded from the remote EDV, total:', edvWallet.contents.length);
  }

  console.log('Wallet result:', edvWallet.toJSON())
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
