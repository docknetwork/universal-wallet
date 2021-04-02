/*
  FSWallet example
*/
import FSWallet from '../src/fs-wallet';
import useStorageWallet from './use-storage-wallet';

// Path to wallet on disk
const walletId = 'mywallet';

/**
  This example creates a filesystem stored wallet. It's not encrypted, it's mostly
  as an example of creating a custom storage interface.
**/
async function main() {
  console.log('Loading filesystem wallet:', walletId);
  const fsWallet = new FSWallet(walletId);
  await useStorageWallet(fsWallet);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
