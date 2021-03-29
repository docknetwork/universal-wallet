import DIDResolver from '@docknetwork/sdk/did-resolver';

const didKeyDriver = require('did-method-key').driver();

// this resolve should be able to resolve did:key dids
// perhaps this would be a good addition to the SDK?
export default class DIDKeyResolver extends DIDResolver {
  constructor() {
    super();
  }

  async resolve(did) {
    const didDocument = await didKeyDriver.get({did});
    return didDocument;
  }
}
