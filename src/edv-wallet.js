import StorageWallet from './storage-wallet';
import EDVHTTPStorageInterface from './storage/edv-http-storage';

class EDVWallet extends StorageWallet {
  constructor(id, storageOptions = {}) {
    const storageInterface = new EDVHTTPStorageInterface({
      url: id,
      ...storageOptions,
    });

    super(id, storageInterface);
  }
}

export default EDVWallet;
