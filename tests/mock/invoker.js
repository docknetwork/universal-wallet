/*!
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */
import forge from 'node-forge';
import {decode} from 'base58-universal';

const {pki: {ed25519}} = forge;

export default class MockInvoker {
  constructor({
    publicKeyBase58,
    privateKeyBase58,
    id,
    controller
  } = {}) {
    this.controller = controller;
    this.id = id || 'did:key:controller#assertionMethodId';
    this.type = 'Ed25519VerificationKey2018';
    if(!publicKeyBase58 && !privateKeyBase58) {
      const {publicKey, privateKey} = ed25519.generateKeyPair();
      this.publicKey = publicKey;
      this.privateKey = privateKey;
      return this;
    }
    this.privateKey = decode(privateKeyBase58);
    this.privateKey58 = decode(publicKeyBase58);
  }

  async sign({data}) {
    const {privateKey} = this;
    return ed25519.sign({message: data, privateKey});
  }
}
