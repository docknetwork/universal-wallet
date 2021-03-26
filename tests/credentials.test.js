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

// For this test we need a custom DID resolver since we're using example data
import TestDIDResolver from './did-resolver';

describe('Wallet - Credential issuance and verification', () => {
  // Create a wallet with our issuer key
  const wallet = new DockWallet();
  wallet.add(KEY_LOCAL);

  const resolver = new TestDIDResolver();

  let signedVC;

  test('Can issue a credential', async () => {
    signedVC = await wallet.issue(WALLET_UNSIGNED_CREDENTIAL, {
      controller: 'did:key:z6MkjjCpsoQrwnEmqHzLdxWowXk5gjbwor4urC1RPDmGeV8r',
    });
    expect(signedVC).toMatchObject(
      expect.objectContaining({
        proof: expect.anything(),
      }),
    );
  });

  test('Can verify a credential', async () => {
    const verifyResult = await wallet.verify(signedVC, {
      resolver,
    });
    console.log('verifyResult', verifyResult.error)
    expect(verifyResult.verified).toBe(true);
  });
});
