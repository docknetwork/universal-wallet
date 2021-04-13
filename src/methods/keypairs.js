import { X25519KeyAgreementKey2020 } from '@digitalbazaar/x25519-key-agreement-key-2020';
import { X25519KeyAgreementKey2019 } from '@digitalbazaar/x25519-key-agreement-key-2019';
import { Ed25519VerificationKey2018 } from '@digitalbazaar/ed25519-verification-key-2018';
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Sr25519VerificationKey2020 } from '../keys/sr25519-key';

// NOTE:
// digitalbazaar provide a library for EcdsaSecp256k1VerificationKey2019 but at this point its not upto
// date to be useable with other libraries. so, for now we will wrap it in a polkadot keypair
// no libraries are provided for Sr25519VerificationKey2020

const keyGenerators = {
  Sr25519VerificationKey2020: async (seed) => Sr25519VerificationKey2020.generate(seed ? {
    seed,
  } : {}),
  Ed25519VerificationKey2018: async (seed) => Ed25519VerificationKey2018.generate(seed ? {
    seed,
  } : {}),
  Ed25519VerificationKey2020: async (seed) => Ed25519VerificationKey2020.generate(seed ? {
    seed,
  } : {}),
  X25519KeyAgreementKey2019: async (seed) => {
    // X25519KeyAgreementKey2019 doesnt support seed in generate method, so we will derive
    // from a Ed25519VerificationKey2018 keypair
    const edPair = await Ed25519VerificationKey2018.generate(seed && { seed });
    return X25519KeyAgreementKey2019.fromEdKeyPair({ keyPair: edPair });
  },
  X25519KeyAgreementKey2020: async (seed) => {
    // X25519KeyAgreementKey2020 doesnt support seed in generate method, so we will derive
    // from a Ed25519VerificationKey2020 keypair
    const edPair = await Ed25519VerificationKey2020.generate(seed && { seed });
    return X25519KeyAgreementKey2020.fromEd25519VerificationKey2020({ keyPair: edPair });
  },
};

const keyConstructors = {
  Sr25519VerificationKey2020: (keypairOptions) => new Sr25519VerificationKey2020(keypairOptions),
  Ed25519VerificationKey2018: (keypairOptions) => new Ed25519VerificationKey2018(keypairOptions),
  Ed25519VerificationKey2020: (keypairOptions) => new Ed25519VerificationKey2020(keypairOptions),
  X25519KeyAgreementKey2019: (keypairOptions) => new X25519KeyAgreementKey2019(keypairOptions),
  X25519KeyAgreementKey2020: (keypairOptions) => new X25519KeyAgreementKey2020(keypairOptions),
};

export function getKeypairFromDoc(keypairOptions) {
  const { type } = keypairOptions;
  const keyConstructor = keyConstructors[type];
  if (!keyConstructor) {
    throw new Error(`Unrecognized keypair type to construct: ${type}`);
  }
  return keyConstructor(keypairOptions);
}

export function getKeypairDocFromWallet(wallet, controller) {
  const results = wallet.contents.filter((content) => content.controller === controller);
  return results[0];
}

export function getKeypairFromController(wallet, controller) {
  // Determine keypair object from controller input
  const keyPairDocument = getKeypairDocFromWallet(wallet, controller);
  if (!keyPairDocument) {
    throw new Error(`Unable to find keypair in wallet contents with controller: ${controller}`);
  }

  // Get keypair instance from document
  const keyPairInstance = getKeypairFromDoc(keyPairDocument);
  if (!keyPairInstance) {
    throw new Error('Unable to determine keypair instance from document');
  }
  return keyPairInstance;
}

export function getKeydocFromPair(keyPair) {
  if (typeof keyPair.toKeyPair === 'function') {
    return keyPair.toKeyPair(true);
  } else if (typeof keyPair.export === 'function') {
    return keyPair.export({ publicKey: true, privateKey: true });
  }
  return keyPair;
}

export async function getKeypairFromDerivedKey(derivedKey, type = 'X25519KeyAgreementKey2020') {
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
