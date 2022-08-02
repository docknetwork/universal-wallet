import DIDResolver from '@docknetwork/sdk/did-resolver';
import { driver } from '@digitalbazaar/did-method-key';

const didKeyDriver = driver();

// this resolve should be able to resolve did:key dids
// perhaps this would be a good addition to the SDK?
export default class DIDKeyResolver extends DIDResolver {
  constructor() {
    super();
  }

  async resolve(did) {
    const didDocument = await didKeyDriver.get({ did });
    // HACK: set context manually as current version of didKeyDriver has an invalid one that
    // causes sdk verification to fail
    // didDocument['@context'] = ['https://www.w3.org/ns/did/v1'];
    didDocument['@context'] = 'https://w3id.org/security/v2';

    // HACK: also sdk doesnt supportEd25519VerificationKey2020
    if (didDocument.type === 'Ed25519VerificationKey2020') {
      didDocument.type = 'Ed25519VerificationKey2018';
    }

    // HACK: publicKeyMultibase is b58 string prepended with a "z"
    if (didDocument.publicKeyMultibase) {
      didDocument.publicKeyBase58 = didDocument.publicKeyMultibase.substr(1);
      delete didDocument.publicKeyMultibase;
    }

    // HACK NOTES:
    // an older version of this lib outputs different document structure which sdk supports
    // but, it breaks some crypto methods in node-forge due to Buffers existing in node
    // this later version doesnt have that issue but SDK needs to be updated to support latest specs
    return didDocument;
  }
}
