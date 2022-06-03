import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';

import DockWallet from '@docknetwork/wallet';

import { useDropzone } from 'react-dropzone';
import lockedJSON from './wallet.json';

import styles from '../styles/Home.module.css';

function UploadWalletView({ setWallet }) {
  // const [walletPW, setWalletPW] = useState();

  async function loadWallet(json, pw) {
    const wallet = new DockWallet('test');
    await wallet.import(json, pw);
    setWallet(wallet);
  }

  function handleUseExampleWallet() {
    loadWallet(lockedJSON, 'Testbuild155!');
  }

  const onDrop = useCallback((acceptedFiles) => {
    const acceptedFile = acceptedFiles[0];
    const reader = new FileReader();
    reader.readAsText(acceptedFile);
    reader.onload = function () {
      loadWallet(JSON.parse(reader.result), 'Testbuild155!');
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <>
        <h1 className={styles.title}>
          <a href="https://dock.io">Dock</a> Wallet Webtool
        </h1>

        <p className={styles.description}>
          Upload your wallet JSON file here to view its contents
        </p>

        <div className={styles.grid}>
          <div className={styles.cardFull} {...getRootProps()}>
          <input {...getInputProps()} />
          {
            isDragActive
              ? <div>Drop the files here ...</div>
              : <div>Drag and drop some files here, or click to select files</div>
          }
          </div>

          <a href="https://github.com/docknetwork/wallet" className={styles.card}>
            <h2>Learn &rarr;</h2>
            <p>
              Check your the Dock Universal Wallet library on GitHub to learn more
            </p>
          </a>

          <a
            onClick={handleUseExampleWallet}
            href="#"
            className={styles.card}
          >
            <h2>Use Example &rarr;</h2>
            <p>
              Use the example wallet to see what the features are etc redo this wording
            </p>
          </a>
        </div>
    </>
  );
}

function InspectWalletView({ wallet }) {
  return (
    <div>

      <code>
        <pre>
          {JSON.stringify(wallet.toJSON(), null, 2)}
        </pre>
      </code>

    </div>
  );
}

export default function Home() {
  const [wallet, setWallet] = useState();

  return (
    <div className={styles.container}>
      <Head>
        <title>Dock Wallet Webtool</title>
        <meta name="description" content="A simple tool to look at your wallet contents" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {
          wallet ? (
            <InspectWalletView {...{ wallet, setWallet }} />
          ) : (
            <UploadWalletView {...{ wallet, setWallet }} />
          )
        }
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}
