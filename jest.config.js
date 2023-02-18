module.exports = {
  bail: true,
  clearMocks: true,
  testTimeout: 30000,
  testEnvironment: './tests/test-environment.js',
  transformIgnorePatterns: [
    "/node_modules/(?!@polkadot|@babel|@docknetwork)"
  ],
  globals: {
    Uint8Array,
    Uint32Array,
    ArrayBuffer,
    TextDecoder,
    TextEncoder,
  },
};

// module.exports = {
//   bail: true,
//   clearMocks: true,
//   testTimeout: 30000,
//   testEnvironment: './tests/test-environment.js',
//   transformIgnorePatterns: [
//     "/node_modules/(?!@polkadot|@babel|@docknetwork|@digitalbazaar|base58-universal|crypto-ld)"
//   ],
//   globals: {
//     Uint8Array,
//     Uint32Array,
//     ArrayBuffer,
//     TextDecoder,
//     TextEncoder,
//   },
// };
