# Dock Wallet Library
In-development, initially based on: https://github.com/w3c-ccg/universal-wallet-interop-spec/blob/master/packages/universal-wallet
Currently only supporting X25519 keys with passwords, planning to expand. See: https://github.com/digitalbazaar/minimal-cipher for key management examples

NOTE: There is a an odd bug which causes some crypto methods to fail, probably due to using unstable packages. Had to comment out some type checks manually and the code works, so don't think it's a problem on our side. Currently investigating this.
