import DockWallet from './dock-wallet';

class StorageWallet extends DockWallet {
  constructor(id, storageInterface) {
    super(id);

    this.promises = [];
    this.storageInterface = storageInterface;

    // TODO: load wallet contents

  }

  add(content) {
    super.add(content);

    console.log('add content', content)

    // TODO: indexing, perhaps indexing is an EDV thing only for now

    const promise = this.storageInterface.insert({
      document: {
        // TODO: overwrite id?
        ...content,
      },
    });
    this.promises.push(promise);
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
