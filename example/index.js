import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import DockWallet from '../src/dock-wallet';
import { getKeypairFromDoc } from '../src/methods/keypairs';
import keyAgreementKey from '../tests/constants/keys/key-agreement-key.json';
import keyBase58 from '../tests/constants/keys/key-base58.json';
import MockHmac from '../tests/mock/hmac';

// Currently this example requires that you run a secure data vault server
async function main() {
  // Get mock keys
  // Ideally you would use a key management system
  // See readme for more: https://github.com/digitalbazaar/edv-client
  const hmac = await MockHmac.create();
  
  const keys = {
    keyAgreementKey,
    hmac,
  };

  const { controller } = keyAgreementKey;

  // Create a storage interface pointing to a local server
  const storageInterface = new EDVHTTPStorageInterface({ url: 'http://localhost:8080', keys });

  // Try to get existing primary reference for our controller
  const existingConfig = await storageInterface.findConfigFor(controller);

  // If it doesn't exist, let's create it
  let edvId = existingConfig && existingConfig.id;
  if (!edvId) {
    edvId = await storageInterface.createEdv({
      controller: controller,
      referenceId: 'primary', // TODO: Setting referenceId because there can only be one primary
    });
  }

  // Connect the storage interface to the EDV
  console.log('EDV found/created:', edvId, ' - connecting to it');
  storageInterface.connectTo(edvId);
  storageInterface.ensureIndex({attribute: 'content.indexedKey'});

  const keyPairInstance = getKeypairFromDoc(keyBase58);
  const invocationSigner = keyPairInstance.signer();
  keyPairInstance.sign = invocationSigner.sign;

  const newDocumentId = await storageInterface.genereateDocumentId();
  await storageInterface.insertDocument(newDocumentId, keyPairInstance);

  // TODO: insert, update, get documents to put into the wallet

  console.log('TODO:', storageInterface);
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
