import DockWallet from './dock-wallet';

/** The Dock Wallet which loads, adds, removes and queries contents in an EDV */
class StorageWallet extends DockWallet {
  constructor(id, storageInterface) {
    super(id);

    this.promises = [];
    this.storageInterface = storageInterface;
  }

  async load() {
    const { documents } = await this.storageInterface.find();
    documents.forEach(document => super.add(document.content));
    return this.contents;
  }

  add(content) {
    super.add(content);
    const promise = this.storageInterface.insert({
      document: {
        content,
      },
    });
    this.promises.push(promise);
  }

  remove(contentId) {
    super.remove(contentId);
    this.promises.push(this.removeFromStorage(contentId));
  }

  async removeFromStorage(contentId) {
    const { documents } = await this.storageInterface.find({
      equals: {
        'content.id': contentId,
      },
    });

    if (documents.length) {
      await this.storageInterface.delete({
        document: documents[0],
      });
    } else {
      throw new Error(`Unable to find storage document to remove content: ${contentId}`);
    }
  }

  async query(search) {
    const { documents } = await this.storageInterface.find(search);
    return documents.map(document => document.content);
  }

  async sync() {
    // call this method to ensure storage interface requests finish
    // we do this because wallet doesnt require blocking operations
    // unless user requires them for specific purpose
    const promises = this.promises;
    this.promises = [];
    await Promise.all(promises);
  }
}

export default StorageWallet;
