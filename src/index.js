/** Library class is defined here */
class MyIndex {
  /**
   * Creates a new instance MyIndex
   * @constructor
   */
  constructor() {
    console.log('Hello world!');
  }

  /**
   * Checks if value is truthy
   * @param {any} value - Any value to check for truthy
   * @return {Boolean}
   */
  isTrue(value) {
    return !!value;
  }
}

export default MyIndex;
