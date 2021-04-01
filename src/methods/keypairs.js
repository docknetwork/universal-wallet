import { Ed25519KeyPair } from '@transmute/did-key-ed25519';

export function getKeypairFromDoc({ id, type, controller, publicKeyBase58, privateKeyBase58 }) {
  // TOOD: proper type detection, move this method
  return new Ed25519KeyPair({
    id,
    controller,
    publicKeyBase58,
    privateKeyBase58,
  });
}

export function getKeypairDocFromWallet(wallet, controller) {
  const results = wallet.contents.filter(content => {
    return content.controller === controller;
  });
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
    throw new Error(`Unable to determine keypair instance from document`);
  }
  return keyPairInstance;
}
