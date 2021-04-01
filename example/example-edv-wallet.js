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

/**
  Currently this example requires that you run a secure data vault server locally
  Idea of a flow:
    One document in EDV = One document in the wallet
    Document capabilities can be different depending
    Would need a way to search documents in the EDV
**/
async function createWallet() {
  const edvWallet = new EDVWallet('http://localhost:8080/edvs/documentid');
}

async function restoreWallet() {

}

async function main() {
  // Create a wallet
  const createdWallet = await createWallet();

  // Save the wallet
  const savedWallet = await saveWallet(createdWallet);

  // Restore the wallet
  const restoredWallet = await restoreWallet();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
