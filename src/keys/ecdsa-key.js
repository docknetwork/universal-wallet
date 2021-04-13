import * as base58btc from 'base58-universal';
import { LDKeyPair } from 'crypto-ld';
import { schnorrkelVerify, schnorrkelSign, schnorrkelKeypairFromSeed } from '@polkadot/util-crypto/schnorrkel';
import { randomBytes } from 'crypto';

const SUITE_ID = 'EcdsaSecp256k1VerificationKey2019';

export class EcdsaSecp256k1VerificationKey2019 extends LDKeyPair {
  /**
   * An implementation of the EcdsaSecp256k1VerificationKey2019 spec, for use with
   * Linked Data Proofs.
   *
   * @see https://github.com/digitalbazaar/jsonld-signatures
   *
   * @param {object} options - Options hashmap.
   * @param {string} options.controller - Controller DID or document url.
   * @param {string} [options.id] - The key ID. If not provided, will be
   *   composed of controller and key fingerprint as hash fragment.
   * @param {string} options.publicKeyBase58 - The Base58 encoded Public Key.
   * @param {string} [options.privateKeyBase58] - The Base58 Private Key.
   * @param {string} [options.revoked] - Timestamp of when the key has been
   *   revoked, in RFC3339 format. If not present, the key itself is considered
   *   not revoked. Note that this mechanism is slightly different than DID
   *   Document key revocation, where a DID controller can revoke a key from
   *   that DID by removing it from the DID Document.
   */
  constructor(options = {}) {
    super(options);
    this.type = SUITE_ID;
    this.id = options.id;
    this.controller = options.controller;
    this.privateKeyBase58 = options.privateKeyBase58;
    this.publicKeyBase58 = options.publicKeyBase58;
    if(!this.publicKeyBase58) {
      throw new TypeError('The "publicKeyBase58" property is required.');
    }

    if(this.controller && !this.id) {
      this.id = `${this.controller}#${this.fingerprint()}`;
    }
  }

  /**
   * Creates a Sr25519 Key Pair from an existing serialized key pair.
   *
   * @param {object} options - Key pair options (see constructor).
   * @example
   * > const keyPair = await EcdsaSecp256k1VerificationKey2019.from({
   * controller: 'did:ex:1234',
   * type: 'EcdsaSecp256k1VerificationKey2019',
   * publicKeyBase58,
   * privateKeyBase58,
   * });
   *
   * @returns {Promise<EcdsaSecp256k1VerificationKey2019>} An Sr25519 Key Pair.
   */
  static async from(options) {
    return new EcdsaSecp256k1VerificationKey2019(options);
  }

  /**
   * Generates a KeyPair with an optional deterministic seed.
   *
   * @param {object} [options={}] - Options hashmap.
   * @param {Uint8Array} [options.seed] - A 32-byte array seed for a
   *   deterministic key.
   *
   * @returns {Promise<EcdsaSecp256k1VerificationKey2019>} Resolves with generated
   *   public/private key pair.
   */
  static async generate({seed, ...keyPairOptions} = {}) {
    let keyObject;
    if(seed) {
      keyObject = schnorrkelKeypairFromSeed(seed);
    } else {
      const randomSeed = await randomBytesAsync(32);
      keyObject = schnorrkelKeypairFromSeed(randomSeed);
    }
    return new EcdsaSecp256k1VerificationKey2019({
      // prefix with `z` to indicate multi-base base58btc encoding
      publicKeyBase58: base58btc.encode(keyObject.publicKey),
      privateKeyBase58: base58btc.encode(keyObject.secretKey),
      ...keyPairOptions
    });
  }

  /**
   * Creates an instance of EcdsaSecp256k1VerificationKey2019 from a key fingerprint.
   *
   * @param {object} options - Options hashmap.
   * @param {string} options.fingerprint - Multibase encoded key fingerprint.
   *
   * @returns {EcdsaSecp256k1VerificationKey2019} Returns key pair instance (with
   *   public key only).
   */
  static fromFingerprint({fingerprint} = {}) {
    if(!fingerprint ||
      !(typeof fingerprint === 'string' && fingerprint[0] === 'z')) {
      throw new Error('`fingerprint` must be a multibase encoded string.');
    }

    // skip leading `z` that indicates base58 encoding
    const buffer = base58btc.decode(fingerprint.substr(1));

    // buffer is: 0xe7 0x01 <public key bytes>
    if(buffer[0] === 0xe7 && buffer[1] === 0x01) {
      return new EcdsaSecp256k1VerificationKey2019({
        publicKeyBase58: base58btc.encode(buffer.slice(2)),
      });
    }

    throw new Error(`Unsupported fingerprint "${fingerprint}".`);
  }

  get _publicKeyBuffer() {
    return base58btc.decode(this.publicKeyBase58);
  }

  get _privateKeyBuffer() {
    return base58btc.decode(this.privateKeyBase58);
  }

  /**
   * Generates and returns a multiformats encoded
   * Sr25519 public key fingerprint (for use with cryptonyms, for example).
   *
   * @see https://github.com/multiformats/multicodec
   *
   * @returns {string} The fingerprint.
   */
  fingerprint() {
    const pubkeyBytes = this._publicKeyBuffer;
    const buffer = new Uint8Array(2 + pubkeyBytes.length);
    // See https://github.com/multiformats/multicodec/blob/master/table.csv
    // 0xe7 is Secp256k1 public key
    buffer[0] = 0xe7; //
    buffer[1] = 0x01;
    buffer.set(pubkeyBytes, 2);
    // prefix with `z` to indicate multi-base base58btc encoding
    return `z${base58btc.encode(buffer)}`;
  }

  /**
   * Exports the serialized representation of the KeyPair
   * and other information that JSON-LD Signatures can use to form a proof.
   *
   * @param {object} [options={}] - Options hashmap.
   * @param {boolean} [options.publicKey] - Export public key material?
   * @param {boolean} [options.privateKey] - Export private key material?
   * @param {boolean} [options.includeContext] - Include JSON-LD context?
   *
   * @returns {object} A plain js object that's ready for serialization
   *   (to JSON, etc), for use in DIDs, Linked Data Proofs, etc.
   */
  export({publicKey = false, privateKey = false, includeContext = false} = {}) {
    if(!(publicKey || privateKey)) {
      throw new TypeError(
        'Export requires specifying either "publicKey" or "privateKey".');
    }
    const exportedKey = {
      id: this.id,
      type: this.type
    };
    if(includeContext) {
      exportedKey['@context'] = EcdsaSecp256k1VerificationKey2019.SUITE_CONTEXT;
    }
    if(this.controller) {
      exportedKey.controller = this.controller;
    }
    if(publicKey) {
      exportedKey.publicKeyBase58 = this.publicKeyBase58;
    }
    if(privateKey) {
      exportedKey.privateKeyBase58 = this.privateKeyBase58;
    }
    if(this.revoked) {
      exportedKey.revoked = this.revoked;
    }
    return exportedKey;
  }

  /**
   * Tests whether the fingerprint was generated from a given key pair.
   *
   * @example
   * > edKeyPair.verifyFingerprint({fingerprint: 'z2S2Q6MkaFJewa'});
   * {valid: true};
   *
   * @param {object} options - Options hashmap.
   * @param {string} options.fingerprint - A public key fingerprint.
   *
   * @returns {{valid: boolean, error: *}} Result of verification.
   */
  verifyFingerprint({fingerprint} = {}) {
    // fingerprint should have `z` prefix indicating
    // that it's multi-base encoded
    if(!(typeof fingerprint === 'string' && fingerprint[0] === 'z')) {
      return {
        error: new Error('`fingerprint` must be a multibase encoded string.'),
        valid: false
      };
    }
    let fingerprintBuffer;
    try {
      fingerprintBuffer = base58btc.decode(fingerprint.substr(1));
      if(!fingerprintBuffer) {
        throw new TypeError('Invalid encoding of fingerprint.');
      }
    } catch(e) {
      return {error: e, valid: false};
    }

    const buffersEqual = _isEqualBuffer(this._publicKeyBuffer,
      fingerprintBuffer.slice(2));

    // validate the first two multicodec bytes 0xdf01
    const valid = fingerprintBuffer[0] === 0xdf &&
      fingerprintBuffer[1] === 0x01 &&
      buffersEqual;
    if(!valid) {
      return {
        error: new Error('The fingerprint does not match the public key.'),
        valid: false
      };
    }
    return {valid};
  }

  signer() {
    const publicKeyBuffer = this._publicKeyBuffer;
    const privateKeyBuffer = this._privateKeyBuffer;
    if(!privateKeyBuffer) {
      throw new Error('No private key to sign with.');
    }

    return {
      async sign({data}) {
        return schnorrkelSign(data, {
          publicKey: publicKeyBuffer,
          secretKey: privateKeyBuffer,
        });
      },
      id: this.id
    };
  }

  verifier() {
    const publicKeyBuffer = this._publicKeyBuffer;
    return {
      async verify({data, signature}) {
        return schnorrkelVerify(data, signature, publicKeyBuffer);
      },
      id: this.id
    };
  }
}
// Used by CryptoLD harness for dispatching.
EcdsaSecp256k1VerificationKey2019.suite = SUITE_ID;
// Used by CryptoLD harness's fromKeyId() method.
EcdsaSecp256k1VerificationKey2019.SUITE_CONTEXT =
  'https://w3id.org/security/suites/sr25519-2020/v1'; // TODO: proper context that can be resolved

function _isEqualBuffer(buf1, buf2) {
  if(buf1.length !== buf2.length) {
    return false;
  }
  for(let i = 0; i < buf1.length; i++) {
    if(buf1[i] !== buf2[i]) {
      return false;
    }
  }
  return true;
}
