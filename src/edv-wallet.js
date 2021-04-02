import StorageWallet from './storage-wallet';
import EDVHTTPStorageInterface from './storage/edv-http-storage';

class EDVWallet extends StorageWallet {
  constructor(id, storageOptions = {}) {
    // Allow user to pass pre-initialized interface or construct a default one
    const storageInterface = storageOptions.storageInterface || new EDVHTTPStorageInterface({
      url: id,
      ...storageOptions,
    });

    // Ensure documents have ID property, are indexed by it, and are unique
    storageInterface.client.ensureIndex({
      attribute: 'content.id',
      unique: true,
    });

    super(id, storageInterface);
  }
}

export default EDVWallet;
