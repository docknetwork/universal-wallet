import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import DockWallet from '../src/dock-wallet';
import keyAgreementKey from '../tests/constants/keys/key-agreement-key.json';

// Currently this example requires that you run a secure data vault server
async function main() {
  // Get mock keys
  // Ideally you would use a key management system
  // See readme for more: https://github.com/digitalbazaar/edv-client
  const keys = {
    keyAgreementKey,
    hmac: {
      id: 'https://example.com/kms/67891',
      type: 'Sha256HmacKey2019'
    }
  };

  // Create a storage interface pointing to a local server
  const storageInterface = new EDVHTTPStorageInterface({ url: 'http://localhost:8080', keys });
  const remoteEDV = await storageInterface.createEdv({
    controller: keyAgreementKey.controller,
    referenceId: 'primary', // TODO: Setting referenceId because there can only be one primary
  });

  console.log('EDV Created:', remoteEDV);
  console.log('Connecting to the EDV...');
  storageInterface.connectTo(remoteEDV)

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
