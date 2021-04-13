import DockWallet from '../src/index';
import dock from '@docknetwork/sdk';
import {
  base64Decode, decodeAddress, encodeAddress, secp256k1Compress, blake2AsU8a,
  naclKeypairFromSeed as naclFromSeed, schnorrkelKeypairFromSeed as schnorrkelFromSeed, secp256k1KeypairFromSeed as secp256k1FromSeed
} from '@polkadot/util-crypto';
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
  ecdsa: '5EwBoJ3H7jLBNoyiUVJTioh7yWsKADUktNjvHcVjaq3PvanL',
}

const polkadotTypesToKeys = {
  sr25519: 'Sr25519VerificationKey2020',
  ed25519: 'Ed25519VerificationKey2018',
  ecdsa: 'EcdsaSecp256k1VerificationKey2019',
};

const TYPE_FROM_SEED = {
  ecdsa: secp256k1FromSeed,
  ed25519: naclFromSeed,
  ethereum: secp256k1FromSeed,
  sr25519: schnorrkelFromSeed
};

// TODO: move thist
function polkadotToKeydoc(polkadotKeys, controller = undefined) {
    const keyPassphrase = 'test';
    const keyjson = polkadotKeys.toJson(keyPassphrase); // TODO: update method to import from json out of band
    const polkadotType = polkadotKeys.type || getKeyPairType(polkadotKeys);

    // NOTE: polkadotKeys.publicKey and publicKey from decodePair result are different for ecdsa type by an extra value on the end
    const decoded = decodePair(keyPassphrase, base64Decode(keyjson.encoded), keyjson.encoding.type);

    let publicKey, secretKey;
    if (decoded.secretKey.length === 64) {
      publicKey = decoded.publicKey;
      secretKey = decoded.secretKey;
    } else {
      const pair = TYPE_FROM_SEED[polkadotType](decoded.secretKey);
      publicKey = pair.publicKey;
      secretKey = pair.secretKey;
    }

    const kpType = polkadotTypesToKeys[polkadotType];
    if (!kpType) {
      throw new Error(`Unknown polkadot type: ${polkadotType}`);
    }

    const formattedkeyDoc = {
      id: `${controller}#keys-1`,
      controller,
      type: kpType,
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

async function signAndVerifyTest(keypair, sourceOfTruthKeypair) {
  console.log('signAndVerifyTest', keypair);

  const testMessage = 'hello world';

  const kp1Signer = keypair.signer();
    console.log('kp1Signer', kp1Signer)

  const kp1SignedData = u8aToHex(await kp1Signer.sign({
    data: testMessage,
  }));

  console.log('kp1SignedData', kp1SignedData)

  const kpTruthSignedData = u8aToHex(await sourceOfTruthKeypair.sign(testMessage));

  console.log('kpTruthSignedData', kpTruthSignedData)

  expect(kp1SignedData).toEqual(kpTruthSignedData);


  // TODO: verify signatures
  const kp1Verifier = keypair.verifier();
  console.log('kp1Verifier', kp1Verifier)
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

  test('Can generate ed25519 key that has same public key as expected in Polkadot', async () => {
    const generatedKeypair = await getKeypairFromDerivedKey(hexToU8a(keySeedHex), 'Ed25519VerificationKey2018');
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'ed25519');
    const publicKey = u8aToHex(base58btc.decode(generatedKeypair.publicKeyBase58));
    expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
    await signAndVerifyTest(generatedKeypair, polkadotKeys);
  });

  test('Can generate sr25519 key that has same public key as expected in Polkadot', async () => {
    const generatedKeypair = await getKeypairFromDerivedKey(hexToU8a(keySeedHex), 'Sr25519VerificationKey2020');
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'sr25519');
    const publicKey = u8aToHex(base58btc.decode(generatedKeypair.publicKeyMultibase.substr(1)));
    expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
    await signAndVerifyTest(generatedKeypair, polkadotKeys);
  });

  test('Can generate ecdsa key that has same public key as expected in Polkadot', async () => {
    const generatedKeypair = await getKeypairFromDerivedKey(hexToU8a(keySeedHex), 'EcdsaSecp256k1VerificationKey2019');
    const polkadotKeys = dock.keyring.addFromUri(keySeedHex, {}, 'ecdsa');
    const publicKey = u8aToHex(base58btc.decode(generatedKeypair.publicKeyBase58));
    expect(publicKey).toEqual(u8aToHex(polkadotKeys.publicKey));
    await signAndVerifyTest(generatedKeypair, polkadotKeys);
  });
});
