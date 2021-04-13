import DockWallet from '../src/index';
import dock from '@docknetwork/sdk';
import { base64Decode, decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import * as base58btc from 'base58-universal';
import { u8aToHex, hexToU8a } from '@polkadot/util';

import {
  decodePair,
} from '@polkadot/keyring/pair/decode';

import {
  getKeyPairType,
} from '@docknetwork/sdk/utils/misc';

import getKeyDoc from '@docknetwork/sdk/utils/vc/helpers';
import * as bs58 from 'base58-universal';

import {
  getKeypairFromDoc,
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

// Predefined key seed
const keySeedHex = '0x7486f32178669ca0febb50dc59787a84193fd00677553370ddd2d383fdd27f3f';

// These account addresses were generated with polkadot frontend using above seed
const expectedAddresses = {
  sr25519: '5FqABwdXytztjT25doNUD3C4uziWqeBs2nEhueD9oeudGdF1',
  ed25519: '5DJJt5T7es4FUF1RWZTNE7L4R68RT5RweJuwtbXiQNSGAH56',
}

// TODO: move thist
function polkadotToKeydoc(polkadotKeys, controller = undefined) {
    const keyPassphrase = 'test';
    const keyjson = polkadotKeys.toJson(keyPassphrase);
    const { publicKey, secretKey } = decodePair(keyPassphrase, base64Decode(keyjson.encoded), keyjson.encoding.type);
    const polkadotTypesToKeys = {
      'sr25519': 'Sr25519VerificationKey2020',
      'ed25519': 'Ed25519VerificationKey2018',
      'ecdsa': 'EcdsaSecp256k1VerificationKey2019',
    };

    const kpType = polkadotTypesToKeys[getKeyPairType(polkadotKeys)];
    const keyDoc = getKeyDoc(controller, polkadotKeys, kpType);
    const formattedkeyDoc = {
      id: keyDoc.id,
      type: keyDoc.type,
      controller: keyDoc.controller,
      publicKeyBase58: bs58.encode(publicKey),
      privateKeyBase58: bs58.encode(secretKey),
      publicKeyMultibase: `z${bs58.encode(publicKey)}`,
      privateKeyMultibase: `z${bs58.encode(secretKey)}`,
    };

  // auto create controller
  if (!controller) {
    const keypairInstance = getKeypairFromDoc(formattedkeyDoc);
    const fingerprint = keypairInstance.fingerprint();
    if (!formattedkeyDoc.controller) {
      formattedkeyDoc.controller = `did:key:${fingerprint}`;
      formattedkeyDoc.id = `did:key:${fingerprint}#${fingerprint}`;
    }
  }
  return formattedkeyDoc;
}

function verifyAddress(keyDoc, polkadotKeys) {
  const publicKey = u8aToHex(base58btc.decode(keyDoc.publicKeyBase58));
  expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
  const address = encodeAddress(publicKey);
  expect(address).toEqual(polkadotKeys.address);
  expect(address).toEqual(expectedAddresses[polkadotKeys.type]);
}

describe('Wallet - Key storage and usage', () => {
  const wallet = new DockWallet();

  beforeAll(async () => {
    await dock.initKeyring();
  });

  test('Can convert Polkadot ed25519 keyring to crypto class', () => {
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'ed25519');
    const keyDoc = polkadotToKeydoc(polkadotKeys);
    verifyAddress(keyDoc, polkadotKeys);
    const keypairInstance = getKeypairFromDoc(keyDoc);
    expect(keypairInstance.type).toEqual('Ed25519VerificationKey2018');
  });

  test('Can convert Polkadot sr25519 keyring to crypto class', () => {
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'sr25519');
    const keyDoc = polkadotToKeydoc(polkadotKeys);
    verifyAddress(keyDoc, polkadotKeys);
    const keypairInstance = getKeypairFromDoc(keyDoc);
    expect(keypairInstance.type).toEqual('Sr25519VerificationKey2020');
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
  });

  test('Can generate Sr25519VerificationKey2020', async () => {
    const keypair = await getKeypairFromDerivedKey(derivedKey, 'Sr25519VerificationKey2020');
    expect(keypair.type).toEqual('Sr25519VerificationKey2020');
  });

  test('Can generate Ed25519VerificationKey2018', async () => {
    const keypair = await getKeypairFromDerivedKey(derivedKey, 'Ed25519VerificationKey2018');
    expect(keypair.type).toEqual('Ed25519VerificationKey2018');
  });

  test('Can generate X25519KeyAgreementKey2019', async () => {
    const keypair = await getKeypairFromDerivedKey(derivedKey, 'X25519KeyAgreementKey2019');
    expect(keypair.type).toEqual('X25519KeyAgreementKey2019');
  });

  test('Can generate X25519KeyAgreementKey2020', async () => {
    const keypair = await getKeypairFromDerivedKey(derivedKey, 'X25519KeyAgreementKey2020');
    expect(keypair.type).toEqual('X25519KeyAgreementKey2020');
  });

  test('Can generate ed25519 key that has same public key as expected in Polkadot', async () => {
    const generatedKeypair = await getKeypairFromDerivedKey(hexToU8a(keySeedHex), 'Ed25519VerificationKey2018');
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'ed25519');
    const publicKey = u8aToHex(base58btc.decode(generatedKeypair.publicKeyBase58));
    expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
  });

  test('Can generate sr25519 key that has same public key as expected in Polkadot', async () => {
    const generatedKeypair = await getKeypairFromDerivedKey(hexToU8a(keySeedHex), 'Sr25519VerificationKey2020');
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'sr25519');
    const publicKey = u8aToHex(base58btc.decode(generatedKeypair.publicKeyMultibase.substr(1)));
    expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
  });
});
