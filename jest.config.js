export default {
  bail: true,
  clearMocks: true,
  testTimeout: 30000,
  testEnvironment: './tests/test-environment.js',
  transformIgnorePatterns: [
    "/node_modules/(?!@polkadot|@babel|@docknetwork|@digitalbazaar|@peculiar|base58-universal|base64url-universal|crypto-ld|ky|ky-universal|node-fetch|fetch-blob|formdata-polyfill|data-uri-to-buffer)"
  ],
  moduleNameMapper: {
    // ponytail: jest resolves the CJS build whose dynamic import() needs --experimental-vm-modules; use the ESM source so babel transforms it
    '^@digitalbazaar/http-client$': '<rootDir>/node_modules/@digitalbazaar/http-client/lib/index.js',
    // ponytail: ky-universal uses top-level await; node >=18 has global fetch so plain ky is enough
    '^ky-universal$': 'ky',
  },
  globals: {
    Uint8Array,
    Uint32Array,
    ArrayBuffer,
    TextDecoder,
    TextEncoder,
  },
};
