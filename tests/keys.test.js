import DockWallet from '../src/index';

import {
  KEY_HARDWARE,
  KEY_REMOTE,
  KEY_LOCAL,
  KEY_JWK,
} from './constants/keys';


describe('Wallet - Key storage and usage', () => {
  const wallet = new DockWallet();

  test('Can add a local base58 key', () => {
    wallet.add(KEY_LOCAL);
    expect(wallet.has(KEY_LOCAL.id)).toBe(true);
  });
});
