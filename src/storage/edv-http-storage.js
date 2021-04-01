import { EdvClient, EdvDocument } from 'edv-client';
import StorageInterface from './storage-interface';

/** EDV HTTP client storage implementation */
class EDVHTTPStorageInterface extends StorageInterface {
  constructor({ url, keys, httpsAgent, defaultHeaders }) {
    super();
    this.serverUrl = url;
    this.keys = keys;
    this.httpsAgent = httpsAgent;
    this.defaultHeaders = defaultHeaders;
    if (!keys || !keys.keyAgreementKey || !keys.hmac) {
      throw new Error('EDVHTTPStorageInterface requires keys object with keyAgreementKey and hmac');
    }

    // Returns keyAgreementKey, dont think we need any other
    // TODO: double check this
    this.keyResolver = ({ id }) => {
      console.log('Debug key resolve:', id)
      if (id === this.keys.keyAgreementKey.id) {
        return this.keys.keyAgreementKey;
      }
      throw new Error(`Key ${id} not found`);
    };
  }

  async get({ id, invocationSigner, capability, recipients }) {
    if (!this.documents.get(id)) {
      const newDocument = new EdvDocument({
        id,
        client: this.client,
        keyAgreementKey: this.client.keyAgreementKey,
        hmac: this.client.hmac,
        keyResolver: this.keyResolver,
        capability,
        recipients,
        invocationSigner,
      });
      this.documents.set(id, newDocument);
    }

    const doc = this.documents.get(id);
    const readResult = await doc.read();
    return readResult;
  }

  insert() {
    // TODO: this
  }

  update() {
    // TODO: this
  }

  delete() {
    // TODO: this
  }

  find() {
    // TODO: this
  }

  async insertDocument({document, invocationSigner, capability}) {
    const insertResult = await this.client.insert(
      {doc: document,
      invocationSigner,
      capability,
    });
    return insertResult;
  }

  ensureIndex(params) {
    this.client.ensureIndex(params);
  }

  updateIndex() {
    // TODO: this
  }

  connectTo(id) {
    if (this.client) {
      throw new Error(`Already connected`);
    }

    if (!id) {
      throw new Error('id parameter is required to connect to an EDV');
    }

    const { keyAgreementKey, hmac } = this.keys;
    this.client = new EdvClient({
      httpsAgent: this.httpsAgent,
      defaultHeaders: this.defaultHeaders,
      keyAgreementKey,
      hmac,
      id,
      keyResolver: this.keyResolver, // TODO: do we need to pass this? probably
    });
    this.documents = new Map();
  }

  async getConfig(id) {
    const remoteConfig = await EdvClient.getConfig({
      url: `${this.serverUrl}/edvs`,
      id,
    });
    return remoteConfig;
  }

  async findConfigFor(controller, referenceId = 'primary') {
    try {
      const remoteConfig = await EdvClient.findConfig({
        url: `${this.serverUrl}/edvs`,
        controller,
        referenceId,
      });
      return remoteConfig;
    } catch (e) {
      return null;
    }
  }

  /**
   * Creates a new EDV using the given configuration and returns its ID
   * TODO: define other params
   * @param {object} options - The options to use.
   * @param {httpsAgent} [options.httpsAgent=undefined] - An optional
   *   node.js `https.Agent` instance to use when making requests.
   * @param {object} [options.headers=undefined] - An optional
   *   headers object to use when making requests.
   * @param {object} [options.invocationSigner] - An object with an
   *   `id` property and a `sign` function for signing a capability invocation.
   * @param {string|object} [options.capability] - A zCap authorizing the
   *   creation of an EDV. Defaults to a root capability derived from
   *   the `url` parameter.
   * @returns {Promise<string>} - Resolves to the ID for the created EDV.
   */
  async createEdv({ controller, invocationSigner, capability, httpsAgent, headers, sequence = 0, referenceId = 'primary' }) {
    const { keyAgreementKey, hmac } = this.keys;
    const config = {
      sequence,
      controller,
      referenceId,
      keyAgreementKey: {id: keyAgreementKey.id, type: keyAgreementKey.type},
      hmac: {id: hmac.id, type: hmac.type}
    };

    // sends a POST request to the remote service to create an EDV
    try {
      const { id } = await EdvClient.createEdv({
        url: `${this.serverUrl}/edvs`,
        invocationSigner, // invocationSigner must be passed if controller is DID
        capability, // capability must be passed if controller is DID
        httpsAgent,
        headers,
        config,
      });

      return id;
    } catch (e) {
      // TODO: better error handling
      throw e;
    }
  }
}

export default EDVHTTPStorageInterface;
