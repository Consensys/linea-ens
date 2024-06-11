# Linea NS App

Friendly forked from ENS V3 app: https://github.com/ensdomains/ens-app-v3

## Usage

### Install

```bash
pnpm i
```

### Quick start on localhost

In a first terminal run:

```bash
cd packages/ens-app-v3
cp .env.example .env
pnpm i
pnpm denv
```

In a second terminal run:

```bash
cd packages/ens-subgraph
yarn setup
```

In a third terminal run:

```bash
cd packages/ens-app-v3
pnpm dev:glocal
```

- Then browse http://localhost:3000/
- Import one of the hardhat test accounts in your metamask (eg: ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
- Add the local test network to your metamask with this info:
  - Localhost 8545
  - http://127.0.0.1:8545
  - 1337
  - ETH
- You can start testing the app

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

You shouldn't deploy the subgraph on top of the existing dataset, instead you should create a clean dataset (explained below).

1. Start the test environment

```bash
pnpm denv --save
```

2. Deploy the subgraph

After the deploy scripts have run, you can deploy the subgraph. Assuming you are in the [ens-subgraph](https://github.com/ensdomains/ens-subgraph) repo, you can use:

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

The structure of the `pages` folder is mimicked inside `components`. Components specific to a page can be found in the the `components` folder, in the folder corresponding to that page.

Components that are used in multiple places will be found in the top level of the `components` folder.
