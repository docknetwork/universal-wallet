import { X25519KeyAgreementKey2019 } from '@digitalbazaar/x25519-key-agreement-key-2019';
import { Ed25519VerificationKey2018 } from '@digitalbazaar/ed25519-verification-key-2018';

import crypto from '../crypto';

export async function passwordToKey(
  password,
  salt = 'salt',
  iterations = 100000,
  digest = 'SHA-256',
) {
  const saltBuffer = Buffer.from(salt);
  const passphraseKey = Buffer.from(password);
  return crypto.subtle
    .importKey('raw', passphraseKey, { name: 'PBKDF2' }, false, [
      'deriveBits',
      'deriveKey',
    ])
    .then((key) => crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations,
        hash: digest,
      },
      key,
      // Note: we don't actually need a cipher suite,
      // but the api requires that it must be specified.
      // For AES the length required to be 128 or 256 bits (not bytes)
      { name: 'AES-CBC', length: 256 },
      // Whether or not the key is extractable (less secure) or not (more secure)
      // when false, the key can only be passed as a web crypto object, not inspected
      true,
      // this web crypto object will only be allowed for these functions
      ['encrypt', 'decrypt'],
    ))
    .then((webKey) => crypto.subtle.exportKey('raw', webKey))
    .then((buffer) => new Uint8Array(buffer));
}

const keyGenerators = {
  Ed25519VerificationKey2018: async (seed) => {
    return Ed25519VerificationKey2018.generate({
      seed,
    });
  },
  X25519KeyAgreementKey2019: async (seed) => {
    const edPair = await Ed25519VerificationKey2018.generate({
      seed,
    });
    return X25519KeyAgreementKey2019.fromEdKeyPair({keyPair: edPair});
  },
};

export async function getKeypairFromDerivedKey(derivedKey, type = 'X25519KeyAgreementKey2019') {
  const keyGenerator = keyGenerators[type];
  if (!keyGenerator) {
    throw new Error(`Unable to generate keypair for type: ${type}`);
  }

  // Generate keypair
  const kp = await keyGenerator(derivedKey);

  // Assign controller and ID as fingerprint
  const fingerprint = kp.fingerprint();
  kp.controller = `did:key:${fingerprint}`;
  kp.id = `${kp.controller}#${fingerprint}`;

  return kp;
}

export async function passwordToKeypair(password) {
  const derivedKey = await passwordToKey(password);
  const keypair = await getKeypairFromDerivedKey(derivedKey);
  return keypair;
}
