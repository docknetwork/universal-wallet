import DockWallet from '../src/index';

import {
  KEY_HARDWARE,
  KEY_REMOTE,
  KEY_LOCAL,
  KEY_JWK,
} from './constants/keys';

import {
  WALLET_UNSIGNED_CREDENTIAL,
} from './constants';


describe('Wallet - Credential issuance and verification', () => {
  // Create a wallet with our issuer key
  const wallet = new DockWallet();
  wallet.add(KEY_LOCAL);

  test('Can issue a credential', async () => {
    await wallet.issue(WALLET_UNSIGNED_CREDENTIAL, {
      verificationMethod: "did:key:z6MkjjCpsoQrwnEmqHzLdxWowXk5gjbwor4urC1RPDmGeV8r#keys-1", // TODO: dont need to pass this sdk does it for us
      proofPurpose: "assertionMethod", // same here
      controller: "did:key:z6MkjjCpsoQrwnEmqHzLdxWowXk5gjbwor4urC1RPDmGeV8r",
      domain: "https://www.dock.io",
      challenge: "0b4e419a-1410-4739-a58d-b37f4db10181",
      proofType: "Ed25519Signature2018"
    });
  });
});
