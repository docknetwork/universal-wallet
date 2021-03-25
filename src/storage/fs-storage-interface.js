/** An example storage interface implementation. This is not secure and shouldn't be used in production */
class FSStorageInterface {
  constructor() {

  }

  get(documentId) {
    // ?
  }
}

/*
  idea: can extend dockwallet so that it uses a storage interface internally
  eg: new DockCloudWallet() which internally uses a cloud storage interface
*/

export default FSStorageInterface;
