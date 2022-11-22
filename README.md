# Dock Universal Wallet Library

This wallet is intended to implement the universl wallet W3C spec for storing credentials, keys, dids and more JSON-LD documents. It comes bundled with some storage interfaces, supports EDVs and is in use by the Dock Wallet app. Check the [examples](./examples) and [tests](./tests) folders for reference implementations. The library is currently in beta status.

[Check out the documentation here](https://docknetwork.github.io/universal-wallet/reference/)

[![Build and Tests](https://github.com/docknetwork/universal-wallet/actions/workflows/test.yml/badge.svg)](https://github.com/docknetwork/universal-wallet/actions/workflows/test.yml)

## Features
- Universal Wallet spec compliant
- EDV storage over HTTP
- Local FS storage
- Expandable storage interface (eg, for react native)
- Wallets are encrypted at rest
- Can be used server or client side
- Can issue credentials straight from the wallet
- Built in did:key support
- Helpers for polkadotjs key management

## Install or build
- Run `yarn add @docknetwork/universal-wallet` or `npm install @docknetwork/universal-wallet` to install the package from npm
- When building from source:
    - Run `yarn` to install the dependencies
    - Run `yarn build` to create a distribution version.

## Reference links
- https://medium.com/transmute-techtalk/encrypted-data-vaults-c794055b170e
- https://docknetwork.github.io/universal-wallet/reference/

## Todos
- Decouple polkadot libraries
