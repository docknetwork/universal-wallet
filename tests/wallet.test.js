import DockWallet from '../src/index';

import {
  WALLET_LOCKED,
  WALLET_UNLOCKED,
  WALLET_SIGNED_CREDENTIAL,
  WALLET_UNSIGNED_CREDENTIAL,
  WALLET_PASSWORD,
} from './constants';

import {
  WALLET_DEFAULT_CONTEXT,
  WALLET_DEFAULT_TYPE,
  WALLET_DEFAULT_ID,
} from '../src/constants';

const lockedWalletObject = {
  '@context': WALLET_LOCKED['@context'],
  id: WALLET_LOCKED.id,
  type: WALLET_LOCKED.type,
  issuer: WALLET_LOCKED.issuer,
  issuanceDate: expect.anything(),
  credentialSubject: expect.objectContaining({
    id: expect.anything(),
    encryptedWalletContents: expect.anything(),
  }),
};

const unlockedWalletObject = {
  '@context': WALLET_DEFAULT_CONTEXT,
  id: WALLET_DEFAULT_ID,
  type: WALLET_DEFAULT_TYPE,
  status: 'UNLOCKED',
  contents: [expect.anything()],
};

describe('Wallet - Basic functionality', () => {
  const wallet = new DockWallet(WALLET_DEFAULT_ID);

  test('Can add a credential', () => {
    wallet.add(WALLET_SIGNED_CREDENTIAL);
    expect(wallet.has(WALLET_SIGNED_CREDENTIAL.id)).toBe(true);
  });

  test('Can lock a wallet', async () => {
    await wallet.lock(WALLET_PASSWORD);
    expect(wallet.status).toBe(DockWallet.Locked);
    expect(wallet.contents[0].ciphertext).toBeDefined();
  });

  test('Can not add or remove when a wallet is locked', () => {
    expect(() => wallet.add(WALLET_SIGNED_CREDENTIAL)).toThrow(/Wallet is locked/);
    expect(() => wallet.remove(WALLET_SIGNED_CREDENTIAL)).toThrow(/Wallet is locked/);
  });

  test('Can unlock a wallet', async () => {
    await wallet.unlock(WALLET_PASSWORD);
    expect(wallet.status).toBe(DockWallet.Unlocked);
    expect(wallet.has(WALLET_SIGNED_CREDENTIAL.id)).toBe(true);
  });

  test('Unlocked JSON representation', () => {
    const walletJSON = wallet.toJSON();
    expect(walletJSON).toMatchObject(unlockedWalletObject);
  });

  test('Can remove a credential', () => {
    wallet.remove(WALLET_SIGNED_CREDENTIAL.id);
    expect(wallet.has(WALLET_SIGNED_CREDENTIAL.id)).toBe(false);
  });

  test('Can query for contents', async () => {
    // Add two items to search between
    wallet.add(WALLET_SIGNED_CREDENTIAL);
    wallet.add(WALLET_UNSIGNED_CREDENTIAL);

    // Query for item 2's ID
    const queryResult = await wallet.query({
      equals: {
        'content.id': WALLET_UNSIGNED_CREDENTIAL.id,
      },
    });

    expect(queryResult[0].id).toEqual(WALLET_UNSIGNED_CREDENTIAL.id);
  });
});

describe('Wallet - Import/Export', () => {
  const wallet = new DockWallet();

  test('Can import, export and re-import a wallet', async () => {
    // Import wallet from file
    await wallet.import(WALLET_LOCKED, WALLET_PASSWORD);
    expect(wallet.has(WALLET_UNLOCKED.contents[0].id)).toBe(true);

    // Get exported credential
    const exportedWallet = await wallet.export(WALLET_PASSWORD);
    expect(exportedWallet).toMatchObject(lockedWalletObject);

    // Try to reimport it
    const importedWallet = new DockWallet();
    await importedWallet.import(exportedWallet, WALLET_PASSWORD);
    expect(importedWallet.has(WALLET_UNLOCKED.contents[0].id)).toBe(true);
  });
});
