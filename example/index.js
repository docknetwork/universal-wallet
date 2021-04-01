/*
  EDV HTTP Storage Interface Example
*/

import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import DockWallet from '../src/dock-wallet';
import { getKeypairFromDoc } from '../src/methods/keypairs';
// import keyAgreementKeyJSON from '../tests/constants/keys/key-agreement-key.json';
import keyBase58 from '../tests/constants/keys/key-base58.json';
import MockHmac from '../tests/mock/hmac';
import MockKak from '../tests/mock/kak';

// Currently this example requires that you run a secure data vault server locally
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

  // Create a storage interface pointing to a local server
  const storageInterface = new EDVHTTPStorageInterface({ url: 'http://localhost:8080', keys });

  // Create or find primary EDV for this controller
  let edvId;
  try {
    console.log('Creating EDV with controller:', controller)
    edvId = await storageInterface.createEdv({
      sequence: 0, // on init the sequence must be 0 and is required
      invocationSigner,
      capability,
      controller,
    });
  } catch (e) {
    // Try to get existing primary reference for our controller
    const existingConfig = await storageInterface.findConfigFor(controller); // TODO: pass auth to this method
    edvId = existingConfig && existingConfig.id;
    if (!edvId) {
      console.error('Unable to create or find primary EDV:');
      throw e;
    }
  }

  // Connect the storage interface to the EDV
  console.log('EDV found/created:', edvId, ' - connecting to it');
  storageInterface.connectTo(edvId);
  storageInterface.ensureIndex({attribute: 'content.indexedKey'});

  const document = {
    content: {
      indexedKey: 'value1',
      someData: 'hello world',
    },
  };

  // Create
  console.log('Creating new EDV document:', document)
  const { id } = await storageInterface.insertDocument({
    document,
    invocationSigner,
    capability,
  });

  // read
  console.log(`Document created with ID ${id}, reading it back...`);
  const { content } = await storageInterface.get({
    id,
    invocationSigner,
  });

  console.log('Read document content:', content)

  // TODO: insert, update, get documents to put into the wallet

  // TODO: create secure storage vault instance
  // somehow able to load wallet contents
  // do we query for all contents at the start and load into the wallet?
  // eg: wallet.import(await getWalletCred(), password);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
