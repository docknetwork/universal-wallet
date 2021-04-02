import {
  WALLET_SIGNED_CREDENTIAL,
} from '../tests/constants';

export default async function useStorageWallet(wallet) {
  // Load the wallet contents
  await wallet.load();

  // Add basic wallet contents if none exist
  if (wallet.contents.length === 0) {
    console.log('Wallet has no documents, adding some...');

    // Add a credential
    console.log('Adding credential to the wallet...', WALLET_SIGNED_CREDENTIAL.id);
    wallet.add(WALLET_SIGNED_CREDENTIAL);

    // Call optional sync method to ensure our storage promises
    // have succeeded and completed
    await wallet.sync();

    // Try add the same item again, it should fail
    try {
      wallet.add(WALLET_SIGNED_CREDENTIAL);
      await wallet.sync();
    } catch (e) {
      console.log('Duplication check succeeded, cant insert two of the same documents.');
    }

    console.log('Wallet contents have been saved to the storage, total:', wallet.contents.length);
    console.log('Run the example again to see contents loaded from the storage');
    console.log('Wallet result:', wallet.toJSON());
  } else {
    // Contents were retrieved from storage, lets display then remove them
    console.log('Wallet contents have been loaded from the storage, total:', wallet.contents.length);
    console.log('Wallet result:', wallet.toJSON());

    // Query wallet for specific item
    const itemResult = await wallet.query({
      equals: {
        'content.id': WALLET_SIGNED_CREDENTIAL.id,
      },
    });

    if (itemResult.length > 0) {
      console.log('Wallet content query successful, found', itemResult[0].id);
    }

    // Remove wallet contents
    console.log('Removing wallet contents from storage...');
    wallet.contents.forEach(content => {
      console.log('\tRemoving:', content.id)
      wallet.remove(content.id);
    });

    // Call optional sync method to ensure our storage promises
    // have succeeded and completed
    await wallet.sync();

    console.log('Wallet contents have been removed from the storage, run the example again to re-create it');
  }
}
