import { Cipher } from '@digitalbazaar/minimal-cipher';

import {
  WALLET_DEFAULT_CONTEXT,
  WALLET_DEFAULT_ENCRYPTED_TYPE,
} from '../constants';

export async function lockWalletContents(contents, kp) {
  // Single recipient, the key who locked the wallet
  const recipients = [{
    header: {
      kid: kp.id,
      alg: 'ECDH-ES+A256KW',
    },
  }];

  // Hardcoded keyResolver to return kp which was used to lock it
  const keyResolver = ({ id }) => {
    if (kp.id === id) {
      const kpResult = kp.toJsonWebKeyPair ? kp.toJsonWebKeyPair(false) : kp;
      if (kpResult.type !== 'X25519KeyAgreementKey2020' && kpResult.type !== 'JsonWebKey2020') {
        // TODO: need a method to convert non-X25519KeyAgreementKey2020 to json here
        throw new Error(`Cipher expects either X25519KeyAgreementKey2020 or JsonWebKey2020, conversion not yet supported.`);
      }
      return kpResult;
    }
    throw new Error(`Key ${id} not found`);
  };

  // Encrypt the wallet
  const cipher = new Cipher();
  return await Promise.all(
    contents.map((content) => cipher.encryptObject({
      obj: { ...content },
      recipients: [...recipients],
      keyResolver,
    })),
  );
}

export async function unlockWalletContents(contents, keyAgreementKey) {
  const cipher = new Cipher();
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
