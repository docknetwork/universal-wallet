import DockWallet from '../src/index';
import dock from '@docknetwork/sdk';
import {
  encodeAddress, blake2AsU8a,
} from '@polkadot/util-crypto';
import * as base58btc from 'base58-universal';
import { u8aToHex, hexToU8a, stringToU8a } from '@polkadot/util';

import {
  getKeypairFromDoc,
  getKeypairFromDerivedKey,
} from '../src/methods/keypairs';

import {
  passwordToKey,
} from '../src/methods/password';

import {
  polkadotToKeydoc,
} from '../src/polkadot-utils';

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
  ecdsa: '5EwBoJ3H7jLBNoyiUVJTioh7yWsKADUktNjvHcVjaq3PvanL',
}

const polkadotTypesToKeys = {
  sr25519: 'Sr25519VerificationKey2020',
  ed25519: 'Ed25519VerificationKey2018',
  ecdsa: 'EcdsaSecp256k1VerificationKey2019',
};


const TYPE_ADDRESS = {
  ecdsa: p => p.length > 32 ? blake2AsU8a(p) : p,
  ed25519: p => p,
  sr25519: p => p
}; // Not 100% correct, since it can be a Uint8Array, but an invalid one - just say "undefined" is anything non-valid


function encodeAddressType(publicKey, type) {
  const raw = TYPE_ADDRESS[type](publicKey);
  return type === 'ethereum' ? null : encodeAddress(raw);
}

function verifyAddress(keyDoc, polkadotKeys) {
  if (typeof keyDoc.publicKeyBase58 !== 'string') {
    throw new Error(`keydoc required publicKeyBase58 as string, got ${keyDoc.publicKeyBase58}`)
  }

  if (typeof keyDoc.privateKeyBase58 !== 'string') {
    throw new Error(`keydoc required privateKeyBase58 as string, got ${keyDoc.privateKeyBase58}`)
  }

  const publicKey = u8aToHex(base58btc.decode(keyDoc.publicKeyBase58));
  expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
  const address = encodeAddressType(publicKey, polkadotKeys.type);
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

  test('Can convert Polkadot ecdsa keyring to crypto class', () => {
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'ecdsa');
    const keyDoc = polkadotToKeydoc(polkadotKeys);
    verifyAddress(keyDoc, polkadotKeys);
    const keypairInstance = getKeypairFromDoc(keyDoc);
    expect(keypairInstance.type).toEqual('EcdsaSecp256k1VerificationKey2019');
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

async function signAndVerifyTest(keypair, sourceOfTruthKeypair, testMessage = 'hello world') {
  const data = stringToU8a(testMessage);
  const kp1Signer = keypair.signer();
  const kpTruthSignedData = u8aToHex(sourceOfTruthKeypair.sign(data));
  const kp1SignedData = u8aToHex(await kp1Signer.sign({
    data,
  }));

  // Verify signatures
  const kp1Verifier = keypair.verifier();
  const verifyResult = await kp1Verifier.verify({
    data,
    signature: hexToU8a(kpTruthSignedData),
  });

  const verifyResult2 = await kp1Verifier.verify({
    data,
    signature: hexToU8a(kp1SignedData),
  });

  // Both verifications should pass
  expect(verifyResult).toEqual(true);
  expect(verifyResult2).toEqual(true);
}

describe('Wallet - Key generation', () => {
  let derivedKey;
  beforeAll(async () => {
    derivedKey = await passwordToKey('testpass');
    await dock.initKeyring();
  });

  test('Can generate EcdsaSecp256k1VerificationKey2019', async () => {
    const keypair = await getKeypairFromDerivedKey(derivedKey, 'EcdsaSecp256k1VerificationKey2019');
    expect(keypair.type).toEqual('EcdsaSecp256k1VerificationKey2019');
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

  test('Can generate ed25519 key that matches polkadot equivalent', async () => {
    const generatedKeypair = await getKeypairFromDerivedKey(hexToU8a(keySeedHex), 'Ed25519VerificationKey2018');
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'ed25519');
    const publicKey = u8aToHex(base58btc.decode(generatedKeypair.publicKeyBase58));
    expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
    await signAndVerifyTest(generatedKeypair, polkadotKeys);
  });

  test('Can generate sr25519 key that matches polkadot equivalent', async () => {
    const generatedKeypair = await getKeypairFromDerivedKey(hexToU8a(keySeedHex), 'Sr25519VerificationKey2020');
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'sr25519');
    const publicKey = u8aToHex(base58btc.decode(generatedKeypair.publicKeyMultibase.substr(1)));
    expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
    await signAndVerifyTest(generatedKeypair, polkadotKeys);
  });
});
