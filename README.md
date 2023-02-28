# Linea Resolver

This repository contains smart contracts and a node.js gateway server that together allow storing ENS names on Linea using [EIP 3668](https://eips.ethereum.org/EIPS/eip-3668) and [ENSIP 10](https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution).

## Usage

### Setup local node

In a terminal, setup a local node:

```bash
cd packages/contracts
yarn install
yarn hardhat node --fork YOUR_GOERLI_L1_RPC_URL
```

### Deploy contracts

In second terminal, deploy L1 and L2 smart contracts:

Compile

```bash
cd packages/contracts
yarn hardhat compile
```

Deploy L2 contracts first:

```bash
npx hardhat run --network goerliLinea scripts/deployL2.ts
```

Get the resolver address, then deploy L1 contracts.

```
RESOLVER_ADDRESS=$RESOLVER_ADDRESS npx hardhat run --network goerli scripts/deployL1.ts
```

### Start Gateway server

Then start the gateway.

```bash
cd ../gateway
yarn
yarn build
yarn start --l2_resolver_address $L2_RESOLVER_ADDRESS --helper_address $HELPER_ADDRESS
```

### Run Client test script

In a third terminal, run the demo app:

```bash
cd packages/clients
yarn start -r $ENS_REGISTRY_ADDRESS test.test
```

If sucessful, it should show the following output

```
[...]
```

## How to deploy to public net (goerli for example)

## Deployed contracts

- Linea goerli resolver = [...]
- goerli (gateway points to '[...]' ) = [...]
- goerli test domain = [...]

## Deploy gateway

Create secret.yaml and update credentials

```
cd gateway
cp secret.yaml.org secret.yaml
```

Deploy to app engine

```
gcloud app deploy goeril.app.yml
```
