import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import DockWallet from '../src/dock-wallet';

// Currently this example requires that you run a secure data vault server
async function main() {
  // TODO: get a mock keyagreementkey to send to the server

  const keys = {
    keyAgreementKey: {
      id: 'test',
      type: 'test',
    },
    hmac: {
      id: 'test',
      type: 'test',
    }
  };

  const storageInterface = new EDVHTTPStorageInterface({ url: 'http://localhost:8080', keys });
  const remoteEDV = await storageInterface.createEdv({
    controller: 'did:key:test3',
    referenceId: 'primary',
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
