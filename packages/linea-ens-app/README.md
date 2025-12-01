# Linea ENS App

This documentation provides instructions on how to set up, deploy, and run the Linea ENS App locally.

Friendly forked from ENS V3 app: [https://github.com/ensdomains/ens-app-v3](https://github.com/ensdomains/ens-app-v3).

## Usage

### Requirements

Install `Node.js`, `pnpm`, `Yarn` and `docker-compose`.

See [Requirements](../../README.md#requirements).

### Install

In the `linea-ens` root folder, run:

```bash
pnpm i
```

### Quick start on localhost

#### 1. Run background services and deploy smart contracts

In a first terminal, run:

```bash
cd packages/linea-ens-app
cp .env.example .env
pnpm i
pnpm denv
```

Once successfully started, you should see `TheGraph` logs:

```bash
graph-node_1  | Jul 11 10:39:41.725 INFO Done processing trigger, gas_used: 197859281, data_source: ENSRegistry, handler: handleNewResolver, total_ms: 2, transaction: 0x807b…2c88, address: 0x5fbd…0aa3, signature: NewResolver(indexed bytes32,address), sgd: 1, subgraph_id: QmUqJV5Z..., component: SubgraphInstanceManager
graph-node_1  | Jul 11 10:39:41.729 INFO Applying 7 entity operation(s), block_hash: 0xb51c59cdbc..., block_number: 79, sgd: 1, subgraph_id: QmUqJV5Z..., component: SubgraphInstanceManager
```

#### 2. Deploy ENS Subgraph

In a second terminal, run:

```bash
cd packages/linea-ens-subgraph
yarn setup
```

Once successfully started, you should see:

```bash
Build completed: QmRmG8bPjg3oy62b...
Deployed to http://127.0.0.1:8000/subgraphs/name/graphprotocol/ens/graphql
```

#### 3. Start Web3Signer

In a third terminal, run:

```bash
cd services/web3signer/
cp ./key-files/examples/signer.yaml ./key-files/signer.yaml
make dev-docker
```

Once successfully started, you should see:

```bash
Web3Signer has started with TLS disabled, and ready to handle signing requests on 0.0.0.0:9000
```

#### 4. Start PoH Signer API

In a fourth terminal, run:

```bash
cd packages/poh-signer-api
cp .env.example .env
pnpm i
make dev
```

Make sure `VERIFIER_CONTRACT_ADDRESS` matches the `PohVerifier` contract address in
`./packages/linea-ens-app/.env.local`.

Once successfully started, you should see:

```bash
Poh Signer Api v1.0.0 development started on port: 4000
```

#### 5. Start ENS frontend

In a fifth terminal, run:

```bash
cd packages/linea-ens-app
pnpm dev:glocal
```

You'll need an account with POH to fully use the local env, if you don't, you can get it
via [Linea Hub] (https://linea.build/hub/).

- Then browse http://localhost:3000/.
- Import one of the hardhat test accounts in your MetaMask to have funds (eg, private key:
  `ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`, for address:
  `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- Add the local test network to your MetaMask with these info:

    - Click on `Add a network manually`
    - Add this config:

  | Setting         | Value                 |
    | --------------- | --------------------- |
  | Network name    | Localhost 8545        |
  | New RPC URL     | http://127.0.0.1:8545 |
  | Chain ID        | 1337                  |
  | Currency symbol | ETH                   |

    - Save and Switch to `Localhost 8455`.
- Transfer 1 ETH from the test account above (eg: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`), to your POH account
    - If you don't have an address with PoH, see [Common Errors](#common-errors).
- You can start testing the app and register a domain.

### Running Dev env

```bash
# For mainnet
pnpm dev

# Or with the test environment running
pnpm dev:glocal
```

### Lint

```bash
pnpm lint
```

### Tests

Currently the tests written by ENS are not working in this repo because they still need to be adapted for this app.

#### **If you need to deploy a new subgraph**

You shouldn't deploy the subgraph on top of the existing dataset, instead you should create a clean dataset (explained
below).

1. Start the test environment

```bash
pnpm denv --save
```

2. Deploy the subgraph

After the deploy scripts have run, you can deploy the subgraph. Assuming you are in
the [linea-ens-subgraph](https://github.com/Consensys/linea-enstree/main/packages/linea-ens-subgraph) repo, you can use:

```bash
yarn setup
```

3. Wait for the subgraph to sync

Similar to the update process, a good indicator of sync status is if you see this message:

```
no chain head update for 30 seconds, polling for update, component: BlockStream
```

Dissimilar to the update process however is that you will never need to mine blocks manually.

4. Exit the test environment

You can exit out of the test environment using `Ctrl+C`.

Once exited, you can commit the data to your branch. You do not need to run a separate save command.

### Building and Starting

```bash
pnpm build
pnpm start

# Or with the test environment running
pnpm build:glocal
pnpm buildandstart:glocal
```

## Architecture

The structure of the `pages` folder is mimicked inside `components`. Components specific to a page can be found in the
`components` folder, in the folder corresponding to that page.

Components that are used in multiple places will be found in the top level of the `components` folder.

## Common Errors

### Node.js version and other requirements

Most installation errors are due to `Node.js`, `pnpm`, `yarn` or `docker-compose` versions. Verify
the [requirements](../../README.md#requirements) if you encounter an error. To verify, you can execute:

```bash
node --version
v18.20.4
```

Node Version Manager (nvm) can be used to manage multiple versions of Node.js if you find you are not in the correct
version of Node.

```bash
pnpm --version
9.4.0
```

```bash
yarn --version
1.22.22
```

```bash
docker-compose --version
docker-compose version 1.29.2, build 5becea4c
```

### Canvas issues

It is possible the Canvas libraries are not installed correctly or missing.
To install/reinstall: First install pkg-config:

```bash
brew install pkg-config
```

Then install dependencies for canvas

```bash
brew install cairo pango libpng jpeg giflib librsvg
```

After installing the dependencies, set the PKG_CONFIG_PATH environment variable:

```bash
export PKG_CONFIG_PATH="/opt/homebrew/lib/pkgconfig:/opt/homebrew/share/pkgconfig:$PKG_CONFIG_PATH"
```

Finally clear npm cache and node_modules:

```bash
npm cache clean --force
rm -rf node_modules
```

### Package Manager errors:

If you encounter a Package Manager error this stems from a Yarn compatibility issue. To resolve this we need to disable
Yarn that has been bundled in with the latest versions of Node.js and install Yarn separately.

To do so follow these steps in the root folder:

1. `corepack disable`
2. `npm install -g pnpm`
3. `npm install -g yarn`

### EACCES: permission denied, unlink

If you encounter this error:

```bash
[Error: EACCES: permission denied, unlink '/home/rapha/studio/linea/ens/linea-ens/packages/linea-ens-app/data/ipfs/api'] {
  errno: -13,
  code: 'EACCES',
  syscall: 'unlink',
  path: '/home/rapha/studio/linea/ens/linea-ens/packages/linea-ens-app/data/ipfs/api'
}
```

To fix it, you can safely remove `data` in `./packages/linea-ens-app/data`.

### Linea PoH Status: INVALID

If your address doesn't have a PoH, for testing purpose you can temporarily deactivate the PoH verification:

1. Edit `linea-ens/packages/poh-signer-api/src/modules/poh/poh.service.ts`.

2. Comment `if` statement on L.30, like:

```
      // if (!pohResponse.poh) {
      //   throw new Error('address not POH');
      // }
```

But you cannot use an address twice, you have to change address for each new registration.
