import DockWallet from './dock-wallet';

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

    // TODO: edv remove call, need to find the edv document id by contentid
  }

  async sync() {
    // call this method to ensure storage interface requests finish
    // we do this because wallet doesnt require blocking operations
    // unless user requires them for specific purpose
    await Promise.all(this.promises);
    this.promises = [];
  }
}

export default StorageWallet;
