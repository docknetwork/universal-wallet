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
  }

  get(documentId) {
    // ?
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

  async genereateDocumentId() {
    const doc1Id = await EdvClient.generateId();
    return doc1Id;
  }

  async insertDocument(docId, invocationSigner) {
    const doc1 = {id: docId, content: {indexedKey: 'value1'}};
    console.log('doc1', doc1)


    const keyResolver = ({ id }) => {
      console.log('iud', id, this.keys.keyAgreementKey.id, this.keys.keyAgreementKey)
      if (id === this.keys.keyAgreementKey.id) {
        return this.keys.keyAgreementKey;
      }
      throw new Error(`Key ${id} not found`);
    };


    // invocationSigner must be a VerificationKey with sign method
    // const invocationSigner = null; // tODO: need this https://github.com/digitalbazaar/edv-client/blob/4f8f3083156d2351cc506a6f4c40e70de5b7bd00/tests/MockInvoker.js#L14
    const insertResult = await this.client.insert({doc: doc1, invocationSigner, keyResolver});
    console.log('insertResult', insertResult)
    const doc = new EdvDocument({
      invocationSigner,
      id: doc1.id,
      keyAgreementKey: this.client.keyAgreementKey,
      hmac: this.client.hmac,
      capability: {
        id: `${this.client.id}`,
        invocationTarget: `${this.client.id}/documents/${doc1.id}`
      },
      keyResolver
    });
    console.log('doc', doc)
    const docResult = await doc.read();
    console.log('docResult', docResult)
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

    const { keyAgreementKey, hmac } = this.keys;
    this.client = new EdvClient({
      httpsAgent: this.httpsAgent,
      defaultHeaders: this.defaultHeaders,
      keyAgreementKey,
      hmac,
      id,
      keyResolver: null, // TODO: do we need to pass this? probably
    });
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

  /*
  * Creates an EDV and returns its ID
  */
  async createEdv({ controller, referenceId = 'primary' }) {
    const { keyAgreementKey, hmac } = this.keys;
    const config = {
      // on init the sequence must be 0 and is required
      sequence: 0,
      controller,
      referenceId,
      keyAgreementKey: {id: keyAgreementKey.id, type: keyAgreementKey.type},
      hmac: {id: hmac.id, type: hmac.type}
    };

    // sends a POST request to the remote service to create an EDV
    try {
      const { id } = await EdvClient.createEdv({
        url: `${this.serverUrl}/edvs`,
        config,
      });

      return id;
    } catch (e) {
      // TODO: better error parsing
      throw e;
    }
  }
}

export default EDVHTTPStorageInterface;
