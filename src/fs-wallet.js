import StorageWallet from './storage-wallet';
import FSStorageInterface from './storage/fs-storage-interface';

class FSWallet extends StorageWallet {
  constructor(id, storageOptions = {}) {
    // Allow user to pass pre-initialized interface or construct a default one
    const storageInterface = storageOptions.storageInterface || new FSStorageInterface(id);
    super(id, storageInterface);
  }
}

export default FSWallet;
