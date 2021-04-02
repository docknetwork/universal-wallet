import { EdvClient, EdvDocument } from 'edv-client';
import StorageInterface from './storage-interface';

/** EDV HTTP client storage implementation */
class EDVHTTPStorageInterface extends StorageInterface {
  constructor({ url, keys, invocationSigner, capability, httpsAgent, defaultHeaders, keyResolver }) {
    super();

    let edvId;
    if (url.indexOf('/edvs/') !== -1) {
      this.serverUrl = url.split('/edvs/')[0];
      edvId = url;
    } else {
      this.serverUrl = url;
    }

    this.keys = keys;
    this.httpsAgent = httpsAgent;
    this.defaultHeaders = defaultHeaders;
    this.invocationSigner = invocationSigner;
    this.capability = capability;
    if (!keys || !keys.keyAgreementKey || !keys.hmac) {
      throw new Error('EDVHTTPStorageInterface requires keys object with keyAgreementKey and hmac');
    }

    // Returns keyAgreementKey, dont think we need any other
    // TODO: double check this
    this.keyResolver = keyResolver;
    if (!this.keyResolver) {
      this.keyResolver = ({ id }) => {
        console.log('Debug key resolve:', id)
        if (id === this.keys.keyAgreementKey.id) {
          return this.keys.keyAgreementKey;
        } else if (id === this.keys.hmac.id) {
          return this.keys.hmac;
        }
        throw new Error(`Key ${id} not found`);
      };
    }

    // Auto connect
    if (edvId) {
      this.connectTo(edvId);
    }
  }

  async get({ id, invocationSigner, capability, recipients }) {
    if (!this.documents.get(id)) {
      const newDocument = new EdvDocument({
        id,
        client: this.client,
        keyAgreementKey: this.client.keyAgreementKey,
        hmac: this.client.hmac,
        keyResolver: this.keyResolver,
        recipients,
        invocationSigner: invocationSigner || this.invocationSigner,
        capability: capability || this.capability,
      });
      this.documents.set(id, newDocument);
    }

    const doc = this.documents.get(id);
    const readResult = await doc.read();
    return readResult;
  }

  async update({ document, invocationSigner, capability, recipients }) {
    const updateResult = await this.client.update({
      recipients,
      doc: document,
      invocationSigner: invocationSigner || this.invocationSigner,
      capability: capability || this.capability,
      keyResolver: this.keyResolver,
    });
    return updateResult;
  }

  async delete({ document, invocationSigner, capability, recipients }) {
    await this.client.delete({
      recipients,
      doc: document,
      invocationSigner: invocationSigner || this.invocationSigner,
      capability: capability || this.capability,
      keyResolver: this.keyResolver,
    });
    this.documents.delete(document.id);
    return document.id;
  }

  async insert({ document, invocationSigner, capability, recipients }) {
    const insertResult = await this.client.insert({
      recipients,
      doc: document,
      invocationSigner: invocationSigner || this.invocationSigner,
      capability: capability || this.capability,
    });
    return insertResult;
  }

  async count({ equals, has, invocationSigner, capability } = {}) {
    const {count} = await this.find({
      equals,
      has,
      count: true,
      invocationSigner,
      capability,
    });
    return count;
  }

  async find({ equals, has, count = false, invocationSigner, capability } = {}) {
    const { keyAgreementKey, hmac } = this.keys;
    const result = await this.client.find({
      equals: (equals || has) ? equals : undefined,
      has: (equals || has) ? has : 'content.id',
      count,
      keyAgreementKey,
      hmac,
      invocationSigner: invocationSigner || this.invocationSigner,
      capability: capability || this.capability,
    });
    return result;
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
      defaultHeaders: this.defaultHeaders,
      keyResolver: this.keyResolver,
      httpsAgent: this.httpsAgent,
      keyAgreementKey,
      hmac,
      id,
    });
    this.documents = new Map();
  }

  async getConfig(id) {
    const remoteConfig = await EdvClient.getConfig({
      url: `${this.serverUrl}/edvs`,
      id,
      httpsAgent: this.httpsAgent,
      headers: this.defaultHeaders,
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

    try {
      const { id } = await EdvClient.createEdv({
        url: `${this.serverUrl}/edvs`,
        // TODO: BUG: with data-vault-example server it will fail when passing invoc and capability, bug on their on i think
        // lines commented out for that reason, needs addressing somehow
        // invocationSigner: invocationSigner || this.invocationSigner, // invocationSigner must be passed if controller is DID
        // capability: capability || this.capability, // capability must be passed if controller is DID
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
