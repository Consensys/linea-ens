# Linea ENS App

This documentation provides instructions on how to set up, deploy, and run the Linea ENS App locally.

Friendly forked from ENS V3 app: https://github.com/ensdomains/ens-app-v3

## Usage

### Requirements

See [Requirements](../../README.md#requirements)

### Install

```bash
pnpm i
```

### Quick start on localhost

#### 1. Run background services and deploy smart contracts

In a first terminal run:

```bash
cd packages/linea-ens-app
cp .env.example .env
pnpm i
pnpm denv
```

#### 2. Deploy ENS Subgraph

In a second terminal run:

```bash
cd packages/linea-ens-subgraph
yarn setup
```

Once successfully started, you should see:

```bash
Build completed: QmRmG8bPjg3oy62b...                                                                                                    │
                                                                                                                                                                   │
Deployed to http://127.0.0.1:8000/subgraphs/name/graphprotocol/ens/graphql   
```

#### 3. Start Web3Signer

In a third terminal run:

```bash
cd services/web3signer/
cp ./keyFiles/examples/signer.yaml ./keyFiles/signer.yaml
make dev-docker
```

Once successfully started, you should see:

```bash
Web3Signer has started with TLS disabled, and ready to handle signing requests on 0.0.0.0:9000
```

#### 4. Start PoH Signer API

In a fourth terminal run:

```bash
cd packages/poh-signer-api
cp .env.example .env
pnpm i
make dev
```

Make sure `VERIFIER_CONTRACT_ADDRESS` matches the `PohVerifier` contract address in ./packages/linea-ens-app/.env.local

Once successfully started, you should see:

```bash
Poh Signer Api v1.0.0 development started on port: 4000 
```

#### 5. Start ENS frontend

In a fifth terminal run:

```bash
cd packages/linea-ens-app
pnpm dev:glocal
```

You'll need an account with POH to fully use the local env, if you don't, you can get it [here] (https://poh.linea.build/)

- Then browse http://localhost:3000/
- Import one of the hardhat test accounts in your metamask to have funds (eg: ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
- Add the local test network to your metamask with this info:
  - Localhost 8545
  - http://127.0.0.1:8545
  - 1337
  - ETH
- Transfer some ETH from the test account to your POH account
- You can start testing the app and register a domain

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

After the deploy scripts have run, you can deploy the subgraph. Assuming you are in the [linea-ens-subgraph](https://github.com/Consensys/linea-enstree/main/packages/linea-ens-subgraph) repo, you can use:

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


### Errors...


```bash
[Error: EACCES: permission denied, unlink '/home/rapha/studio/linea/ens/linea-ens/packages/linea-ens-app/data/ipfs/api'] {                                                                                                                                 
  errno: -13,                                                                                                                                                                                                                                              
  code: 'EACCES',                                                                                                                                                                                                                                          
  syscall: 'unlink',                                                                                                                                                                                                                                       
  path: '/home/rapha/studio/linea/ens/linea-ens/packages/linea-ens-app/data/ipfs/api'                                                                                                                                                                      
}           
```

Remove `./data`
