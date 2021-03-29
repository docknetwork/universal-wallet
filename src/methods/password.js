import { X25519KeyPair } from '@transmute/did-key-x25519';
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

export async function getKeypairFromDerivedKey(derivedKey) {
  const kp = await X25519KeyPair.generate({
    secureRandom: () => derivedKey,
  });
  kp.id = kp.controller + kp.id;
  return kp;
}

export async function passwordToKeypair(password) {
  const derivedKey = await passwordToKey(password);
  const keypair = await getKeypairFromDerivedKey(derivedKey);
  return keypair;
}
