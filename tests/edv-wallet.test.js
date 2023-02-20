import { X25519KeyAgreementKey2020 } from '@digitalbazaar/x25519-key-agreement-key-2020';

import EDVHTTPStorageInterface from '../src/storage/edv-http-storage';
import { getKeypairFromDoc } from '../src/methods/keypairs';
import EDVWallet from '../src/edv-wallet';
import MockHmac from './mock/hmac';

import {
  KEY_KAK,
  KEY_LOCAL,
} from './constants/keys';

import {
  WALLET_UNSIGNED_CREDENTIAL,
} from './constants';

// Taken from https://stackoverflow.com/questions/58325771/how-to-generate-random-hex-string-in-javascript
// does not need to be secure for test purposes
const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

// These tests rely on a local EDV server running on port 8080
describe('EDV Wallet', () => {
  // Get mock keys
  const keyAgreementKey = new X25519KeyAgreementKey2020(KEY_KAK);
  const keys = {
    keyAgreementKey,
    hmac: undefined,
  };

  // Create hacky mock invocation signer
  const { controller } = KEY_LOCAL;
  const invocationSigner = getKeypairFromDoc(KEY_LOCAL);
  invocationSigner.sign = invocationSigner.signer().sign;

  let walletId;
  let edvWallet;
  beforeAll(async () => {
    keys.hmac = await MockHmac.create();

    const storageInterface = new EDVHTTPStorageInterface({
      url: 'http://localhost:8080',
      invocationSigner,
      keys,
    });

    walletId = await storageInterface.createEdv({
      referenceId: genRanHex(32),
      controller,
    });

    edvWallet = new EDVWallet(walletId, { storageInterface });
  });

  test('Can create a new EDV wallet', async () => {
    expect(walletId).toBeDefined();
    expect(edvWallet).toBeDefined();
    expect(edvWallet.id).toEqual(walletId);
  });

  test('Can create contents in the EDV wallet', async () => {
    edvWallet.add(WALLET_UNSIGNED_CREDENTIAL);
    await edvWallet.sync();
    expect(edvWallet.contents[edvWallet.contents.length - 1].id).toEqual(WALLET_UNSIGNED_CREDENTIAL.id);
  });

  test('Can not create duplicate contents in the EDV wallet', async () => {
    const contentCount = edvWallet.contents.length;
    try {
      edvWallet.add(WALLET_UNSIGNED_CREDENTIAL);
      await edvWallet.sync();
    } catch (e) { }
    expect(edvWallet.contents.length).toEqual(contentCount);
  });

  test('Can read contents in the EDV wallet (query by id)', async () => {
    const itemResult = await edvWallet.query({
      equals: {
        'content.id': WALLET_UNSIGNED_CREDENTIAL.id,
      },
    });
    expect(itemResult.length).toEqual(1);
  });

  test('Can update contents in the EDV wallet', async () => {
    const updatedContent = {
      ...WALLET_UNSIGNED_CREDENTIAL,
      credentialSubject: {
        ...WALLET_UNSIGNED_CREDENTIAL.credentialSubject,
        id: controller,
      },
    };
    edvWallet.update(updatedContent);
    await edvWallet.sync();

    const itemResult = await edvWallet.query({
      equals: {
        'content.id': WALLET_UNSIGNED_CREDENTIAL.id,
      },
    });
    expect(itemResult.length).toEqual(1);
    expect(itemResult[0]).toMatchObject(updatedContent);
  });

  test('Can load wallet from an existing EDV', async () => {
    const loadedWallet = new EDVWallet(walletId, {
      invocationSigner,
      keys,
    });
    await loadedWallet.load();
    expect(loadedWallet.contents.length).toEqual(edvWallet.contents.length);
  });

  test('Can delete contents in the EDV wallet', async () => {
    const contentCount = edvWallet.contents.length;
    edvWallet.remove(WALLET_UNSIGNED_CREDENTIAL.id);
    await edvWallet.sync();
    expect(edvWallet.contents.length).toEqual(contentCount - 1);

    const itemResult = await edvWallet.query({
      equals: {
        'content.id': WALLET_UNSIGNED_CREDENTIAL.id,
      },
    });
    expect(itemResult.length).toEqual(0);
  });
});
