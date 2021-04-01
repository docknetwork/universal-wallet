import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import DockWallet from '../src/dock-wallet';
import { getKeypairFromDoc } from '../src/methods/keypairs';
// import keyAgreementKeyJSON from '../tests/constants/keys/key-agreement-key.json';
import keyBase58 from '../tests/constants/keys/key-base58.json';
import MockHmac from '../tests/mock/hmac';
import MockKak from '../tests/mock/kak';
import MockInvoker from '../tests/mock/invoker';

// Currently this example requires that you run a secure data vault server
async function main() {
  // Get mock keys
  // Ideally you would use a key management system
  // See readme for more: https://github.com/digitalbazaar/edv-client
  const hmac = await MockHmac.create();
  const keyAgreementKey = new MockKak();

  const keys = {
    keyAgreementKey,
    hmac,
  };

  const { controller } = keyBase58;
  console.log('Using controller:', controller)
  console.log('Using keys:', keys)


  // not sure if data-vault-example supports ed25519 did:keys
  const invocationSigner = new MockInvoker(keyBase58);
  // const capability = invocationSigner; // TODO:

  // Hacky invocation signer
  // const capability = getKeypairFromDoc(keyBase58);
  // capability.sign = capability.signer().sign;
  const capability = null; // use defaults

  // Create a storage interface pointing to a local server
  const storageInterface = new EDVHTTPStorageInterface({ url: 'http://localhost:8080', keys });

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
  storageInterface.ensureIndex({attribute: 'content.indexedKey'});

  const newDocumentId = await storageInterface.genereateDocumentId();
  const doc1 = {id: newDocumentId, content: {indexedKey: 'value1'}};

  await storageInterface.insertDocument({
    doc1,
    invocationSigner,
    capability,
  });
  console.log('Creating new EDV document:', newDocumentId)

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
