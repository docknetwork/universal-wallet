// ponytail: @peculiar/webcrypto is a Node-only polyfill that webpack can't bundle; browsers and Node 18+ already ship WebCrypto
export class Crypto {
  constructor() {
    return crypto;
  }
}
