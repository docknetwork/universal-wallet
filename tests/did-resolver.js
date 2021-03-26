import DIDResolver from '@docknetwork/sdk/did-resolver';

export default class TestDIDResolver extends DIDResolver {
  constructor() {
    super();
  }

  async resolve(did) {
    console.log('resolve', did);

    return {};
  }
}
