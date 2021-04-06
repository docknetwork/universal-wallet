import DockWallet from './dock-wallet';

/** The Dock Wallet which loads, adds, removes and queries contents in an EDV */
class StorageWallet extends DockWallet {
  constructor(id, storageInterface) {
    super(id);

    this.promises = [];
    this.storageInterface = storageInterface;
  }

  add(content) {
    super.add(content)
    this.promises.push(this.insertToStorage(content));
  }

  remove(contentId) {
    super.remove(contentId);
    this.promises.push(this.removeFromStorage(contentId));
  }

  update(content) {
    super.update(content);
    this.promises.push(this.updateInStorage(content));
  }

  async query(search) {
    // Query storage interface and map into wallet contents
    const { documents } = await this.storageInterface.find(search);
    return documents.map(document => document.content);
  }

  async load() {
    // Find all documents, storage interfaces should return all docs when no params supplied
    const { documents } = await this.storageInterface.find();

    // Format to wallet contents
    if (documents) {
      documents.forEach(document => super.add(document.content));
    }
    return this.contents;
  }

  async updateInStorage(content) {
    const documentResult = await this.getStorageDocument(content);
    await this.storageInterface.update({
      document: {
        ...documentResult,
        content,
      },
    });
  }

  async insertToStorage(content) {
    // Attempt to insert the document to the storage interface
    // if the promise fails, then the content will be removed and error re-thrown
    try {
      await this.storageInterface.insert({
        document: {
          content,
        },
      });
    } catch (e) {
      super.remove(content.id);
      throw e;
    }
  }

  async removeFromStorage(id) {
    await this.storageInterface.delete({
      document: await this.getStorageDocument({ id }),
    });
  }

  async getStorageDocument({ id }) {
    // Find the storage document by the content ID
    // some interfaces may just return the same document, but some need custom structures
    const { documents } = await this.storageInterface.find({
      equals: {
        'content.id': id,
      },
    });

    // Delete first result from storage
    if (documents.length) {
      return documents[0];
    } else {
      throw new Error(`Unable to find storage document by content.id: ${id}`);
    }
  }

  async sync() {
    // A user will call this method to ensure storage interface requests finish
    // we do this because wallet doesnt always require blocking operations
    // depending on the storage interface used
    const promises = this.promises;
    this.promises = [];
    if (promises.length) {
      await Promise.all(promises);
    }
  }
}

export default StorageWallet;
