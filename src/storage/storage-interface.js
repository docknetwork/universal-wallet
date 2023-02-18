/** This class contains the base methods that must be overridden in any storage interface */
export default class StorageInterface {
  async get() {
    throw new Error('StorageInterface get method must be declared in inherited class');
  }

  async update() {
    throw new Error('StorageInterface update method must be declared in inherited class');
  }

  async delete() {
    throw new Error('StorageInterface delete method must be declared in inherited class');
  }

  async insert() {
    throw new Error('StorageInterface insert method must be declared in inherited class');
  }

  async count() {
    throw new Error('StorageInterface count method must be declared in inherited class');
  }

  async find() {
    throw new Error('StorageInterface find method must be declared in inherited class');
  }
}
