import {
  base64Decode, decodeAddress, encodeAddress, secp256k1Compress, blake2AsU8a,
  naclKeypairFromSeed as naclFromSeed, schnorrkelKeypairFromSeed as schnorrkelFromSeed, secp256k1KeypairFromSeed as secp256k1FromSeed
} from '@polkadot/util-crypto';

import * as base58btc from 'base58-universal';
import { u8aToHex, hexToU8a, u8aToU8a, stringToU8a } from '@polkadot/util';

import { decodePair } from '@polkadot/keyring/pair/decode';
import { getKeyPairType } from '@docknetwork/sdk/utils/misc';
import getKeyDoc from '@docknetwork/sdk/utils/vc/helpers';

import * as bs58 from 'base58-universal';

import { getKeypairFromDoc } from './methods/keypairs';

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

// TODO: maybe make this an SDK method instead?
export function polkadotToKeydoc(polkadotKeys, controller = undefined, keyPassphrase = 'test') {
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
