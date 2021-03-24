import { Crypto } from '@peculiar/webcrypto';

function isNodejs() {
  return (
    typeof process === 'object'
    && typeof process.versions === 'object'
    && typeof process.versions.node !== 'undefined'
  );
}

const crypto = isNodejs() ? new Crypto() : window.crypto;

export default crypto;
