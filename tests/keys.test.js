import dock from '@docknetwork/sdk';
import DockWallet from '../src/index';

import {
  getKeypairFromDerivedKey,
} from '../src/methods/keypairs';

import {
  passwordToKey,
} from '../src/methods/password';

import {
  KEY_HARDWARE,
  KEY_REMOTE,
  KEY_LOCAL,
  KEY_JWK,
} from './constants/keys';

describe('Wallet - Key storage and usage', () => {
  const wallet = new DockWallet();

  beforeAll(async () => {
    await dock.initKeyring();
  });

  test('Can add a local base58 key', () => {
    wallet.add(KEY_LOCAL);
    expect(wallet.has(KEY_LOCAL.id)).toBe(true);
    // TODO: retrieve key from wallet by id as crpyto keypair class with helper method and ensure its valid
  });

  // // TODOS:
  // test('Can add a JSON web key', () => {
  //   // TODO: this
  // });
  //
  // test('Can add a remote KMS key', () => {
  //   // TODO: this
  // });
  //
  // test('Can add a hardware key', () => {
  //   // TODO: this
  // });
});

describe('Wallet - Key generation', () => {
  let derivedKey;
  beforeAll(async () => {
    derivedKey = await passwordToKey('testpass');
    await dock.initKeyring();
  });

  test('Can generate X25519KeyAgreementKey2019', async () => {
    const keypair = await getKeypairFromDerivedKey(derivedKey, 'X25519KeyAgreementKey2019');
    expect(keypair.type).toEqual('X25519KeyAgreementKey2019');
  });

  test('Can generate X25519KeyAgreementKey2020', async () => {
    const keypair = await getKeypairFromDerivedKey(derivedKey, 'X25519KeyAgreementKey2020');
    expect(keypair.type).toEqual('X25519KeyAgreementKey2020');
  });
});
