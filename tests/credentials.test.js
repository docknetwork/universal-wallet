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
import DIDKeyResolver from './did-resolver';

describe('Wallet - Credential issuance and verification', () => {
  // Create a wallet with our issuer key
  const wallet = new DockWallet();
  wallet.add(KEY_LOCAL);

  // Create a resolver, for these tests we only use did:key methods so this works
  const resolver = new DIDKeyResolver();

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
    if (!verifyResult.verified) {
      console.error(verifyResult.error);
      verifyResult.error.errors.forEach((error) => console.error('verifyResult error:', error));
    }
    expect(verifyResult.verified).toBe(true);
  });
});
