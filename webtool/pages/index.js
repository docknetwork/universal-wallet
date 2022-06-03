import React, { useState, useCallback } from 'react';
import Head from 'next/head';

import DockWallet from '@docknetwork/wallet';

import { useDropzone } from 'react-dropzone';
import lockedJSON from './wallet.json';

import styles from '../styles/Home.module.css';

function UploadWalletView({ setWallet, setWalletJSON }) {
  // const [walletPW, setWalletPW] = useState();

  async function loadWallet(json, pw) {
    const wallet = new DockWallet('test');
    await wallet.import(json, pw);
    setWallet(wallet);
    setWalletJSON(wallet);
  }

  function handleUseExampleWallet() {
    loadWallet(lockedJSON, 'Testbuild155!');
  }

  const onDrop = useCallback((acceptedFiles) => {
    const acceptedFile = acceptedFiles[0];
    const reader = new FileReader();
    reader.readAsText(acceptedFile);
    reader.onload = () => {
      setWalletJSON(JSON.parse(reader.result));
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

function EnterPasswordView({
  walletJSON, importWallet,
}) {
  const [password, setPassword] = useState();

  function handleChangePassword(e) {
    setPassword(e.target.value);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    await importWallet(walletJSON, password);
  }

  return (
    <>
      <h1 className={styles.title}>
        Password Please
      </h1>

      <p className={styles.description}>
        Enter the password used when exporting this wallet
      </p>

      <form className={styles.passwordForm} onSubmit={handleFormSubmit}>
        <input
          name="password"
          type="password"
          value={password}
          onChange={handleChangePassword} />
        <input type="submit" />
      </form>
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

export default function Index() {
  const [wallet, setWallet] = useState();
  const [walletJSON, setWalletJSON] = useState();
  const isLocked = !!(!wallet && walletJSON && walletJSON.credentialSubject);

  async function importWallet(json, pw) {
    const encryptedWallet = new DockWallet('test');
    try {
      await encryptedWallet.import(json, pw);
      setWallet(encryptedWallet);
    } catch (e) {
      console.error(e);
      alert('unable to decrypt wallet');
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Dock Wallet Webtool</title>
        <meta name="description" content="A simple tool to look at your wallet contents" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {
          (wallet || walletJSON) ? (
            isLocked ? (
              <EnterPasswordView {...{
                wallet, walletJSON, setWallet, importWallet,
              }} />
            ) : (
              <InspectWalletView {...{ wallet, setWallet }} />
            )
          ) : (
            <UploadWalletView {...{ wallet, setWallet, setWalletJSON }} />
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
            <img src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}
