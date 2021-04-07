import fs from 'fs';
import StorageInterface from './storage-interface';

function ensureExistsOrCreate(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

function generateDocumentId() {
  return `doc${Math.floor(Math.random() * 100)}`; // TODO: non-hacky random
}

/** An example file system storage interface implementation. This is not secure and shouldn't be used in production */
class FSStorageInterface extends StorageInterface {
  constructor(directory) {
    super();
    this.directory = directory;
  }

  async get({ id }) {
    const content = JSON.parse(fs.readFileSync(this.buildFilePath(id)));
    return {
      id,
      content,
    };
  }

  async update(options) {
    return this.insert(options);
  }

  async delete({ document }) {
    fs.unlinkSync(this.buildFilePath(document.id));
  }

  async insert({ document }) {
    ensureExistsOrCreate(this.directory);
    const docId = document.id || generateDocumentId();
    fs.writeFileSync(this.buildFilePath(docId), JSON.stringify(document.content, null, 2));
    return {
      id: docId,
      document,
    };
  }

  async count(query) {
    const result = await this.find(query);
    return result.length;
  }

  async find({ has, equals } = {}) {
    ensureExistsOrCreate(this.directory);
    const dirResults = fs.readdirSync(this.directory);
    const documents = dirResults.map((filepath) => {
      if (filepath.indexOf('.json') !== -1) {
        const docId = filepath.replace('.json', '');
        const content = JSON.parse(fs.readFileSync(this.buildFilePath(filepath)));

        let matchesQuery = false;
        if (!has && !equals) { // Return all documents
          matchesQuery = true;
        } else if (equals && equals['content.id']) { // Basic "query" support for tests
          matchesQuery = content.id === equals['content.id'];
        }

        if (matchesQuery) {
          return {
            id: docId,
            content,
          };
        }
      }
    }).filter((value) => !!value);
    return { documents };
  }

  buildFilePath(filepath) {
    let path = filepath;
    if (path.indexOf('.json') === -1) {
      path += '.json';
    }
    return `${this.directory}/${path}`;
  }
}

export default FSStorageInterface;
