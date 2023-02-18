/*
  EDV HTTP Storage Interface Example
*/
import { X25519KeyAgreementKey2020 } from '@digitalbazaar/x25519-key-agreement-key-2020';
import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import DockWallet from '../src/dock-wallet';
import { getKeypairFromDoc } from '../src/methods/keypairs';
import MockHmac from '../tests/mock/hmac';

import {
  KEY_KAK,
  KEY_LOCAL,
} from '../tests/constants/keys';

/**
  Currently this example requires that you run a secure data vault server locally
  The typical flow looks like:
    Create an invocation signer (a verification key with a sign method)
    Create capabilities (or leave undefined for default, root level capabilities)
    Create a storage interface instance
    Create or use an existing EDV, primary referenceId is default
    With that EDV ID, call connectTo on the storage interface to initialize an EDV client
    Call insert on the storage interface, a document with no ID has one generated randomly
    Call get on the storage interface passing the document ID to decrypt and read the contents
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
  const capability = undefined; // use defaults
  const invocationSigner = getKeypairFromDoc(KEY_LOCAL); // hacky mock signer
  invocationSigner.sign = invocationSigner.signer().sign;

  // Create a storage interface pointing to a local server
  const storageInterface = new EDVHTTPStorageInterface({
    url: 'http://localhost:8080',
    keys,

    // Passing these here will use as defaults in other calls by default
    invocationSigner,
    capability,
  });

  // Create or find primary EDV for this controller
  let edvId;
  try {
    console.log('Creating EDV with controller:', controller);
    edvId = await storageInterface.createEdv({
      sequence: 0, // on init the sequence must be 0 and is required
      controller,
    });
  } catch (e) {
    // Try to get existing primary reference for our controller
    const existingConfig = await storageInterface.findConfigFor(controller);
    edvId = existingConfig && existingConfig.id;
    if (!edvId) {
      console.error('Unable to create or find primary EDV:');
      throw e;
    }
  }

  // Connect the storage interface to the EDV
  console.log('EDV found/created:', edvId, ' - connecting to it');
  storageInterface.connectTo(edvId);

  // Define the document to store
  const document = {
    content: {
      someData: 'hello world',
    },
  };

  // Create
  console.log('Creating new EDV document:', document);
  const { id } = await storageInterface.insert({
    document,
  });

  // Read
  console.log(`Document created with ID ${id}, reading it back...`);
  const documentResult = await storageInterface.get({
    id,
  });

  console.log('Read document content:', documentResult.content);

  // Update
  console.log('Updating document contents...');
  await storageInterface.update({
    document: {
      ...documentResult,
      content: {
        someData: 'updated data',
      },
    },
  });

  const documentResultUpdated = await storageInterface.get({
    id,
  });
  console.log('Documented updated with new content:', documentResultUpdated.content);

  // Remove
  console.log('Deleting document from EDV...');
  await storageInterface.delete({
    document: documentResultUpdated,
  });

  // Ensure document now has deleted property if we try to read it
  const documentDeleted = await storageInterface.get({
    id,
  });

  // Finish
  if (documentDeleted.meta.deleted) {
    console.log('Document has been deleted, example success!');
  } else {
    console.error('Document still exists, example failed', documentDeleted);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
