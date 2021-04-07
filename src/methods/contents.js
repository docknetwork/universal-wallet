import { X25519KeyPair } from '@transmute/did-key-x25519';
import { Cipher } from '@transmute/did-key-cipher';

// NOTE: see https://github.com/digitalbazaar/minimal-cipher for key management examples

import {
  WALLET_DEFAULT_CONTEXT,
  WALLET_DEFAULT_ENCRYPTED_TYPE,
} from '../constants';

export async function lockWalletContents(contents, kp) {
  const recipient = {
    header: {
      kid: kp.id,
      alg: 'ECDH-ES+A256KW',
    },
  };
  const recipients = [recipient];

  const keyResolver = ({ id }) => {
    if (kp.id === id) {
      return kp.toJsonWebKeyPair ? kp.toJsonWebKeyPair(false) : kp;
    }
    throw new Error(`Key ${id} not found`);
  };

  const cipher = new Cipher(X25519KeyPair); // TODO: derive cipher from kp
  return await Promise.all(
    contents.map((content) => cipher.encryptObject({
      obj: { ...content },
      recipients: [...recipients],
      keyResolver,
    })),
  );
}

export async function unlockWalletContents(contents, keyAgreementKey) {
  const cipher = new Cipher(X25519KeyPair); // TODO: derive cipher from kp
  return await Promise.all(contents.map((content) => cipher.decryptObject({
    jwe: content,
    keyAgreementKey,
  })));
}

export async function contentsFromEncryptedWalletCredential(encryptedWalletCredential, kp) {
  const encryptedContents = encryptedWalletCredential.credentialSubject.encryptedWalletContents;
  const unlockedContents = await unlockWalletContents([
    encryptedContents,
  ], kp);

  return unlockedContents[0].contents;
}

export async function exportContentsAsCredential(contents, kp, issuanceDate = new Date()) {
  const lockedContents = await lockWalletContents([{
    contents,
  }], kp);

  return {
    '@context': WALLET_DEFAULT_CONTEXT,
    // consider using content id of ciphertext here...
    id: `${kp.controller}#encrypted-wallet`,
    type: WALLET_DEFAULT_ENCRYPTED_TYPE,
    issuer: kp.controller,
    issuanceDate: issuanceDate.toISOString(),
    credentialSubject: {
      id: kp.controller,
      encryptedWalletContents: lockedContents[0],
    },
  };
}
