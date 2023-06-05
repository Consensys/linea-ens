# Linea Resolver

This repository contains smart contracts and a Node.js Gateway server that together allow storing ENS names on Linea using [EIP 3668](https://eips.ethereum.org/EIPS/eip-3668) and [ENSIP 10](https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution).

## Components

### Contracts

LineaResolverStub is a L1 (Ethereum) ENS resolver contract that implements the proposed protocol, with functions to return the gateway address and required prefix for a query, and to verify the response from the gateway.

LineaResolver is an L2 (Linea) ENS resolver contract that stores and returns the data necessary to resolve an ENS name.

Additionally, LineaResolver implements the ERC721 Non-Fungible Token (NFT) standard. Each subdomain registered through the LineaResolver contract is represented as a unique ERC721 token, allowing for the ownership and transfer of these subdomains in a standardized, interoperable manner across Ethereum-based platforms.

More Smart Contracts documentation available in [./packages/contracts/README.md](./packages/contracts/README.md)

### Gateway

A node-based gateway server that answers queries for L2 Gateway function calls relating to Optimism-based L2 resolvers.

### Client

A very simple script that tests if ccip-read integration is working.

## Test in a mixed local/L2 mode

### Setup local node

In a terminal, setup a L1 local node:

```shell
cd packages/contracts
yarn install
yarn hardhat node --fork <L1_PROVIDER_URL>
```

`L1_PROVIDER_URL` is described in the config section bellow.

### Deploy contracts

In second terminal, deploy L1 and L2 smart contracts.

Set your `.env` config file. You can copy [env.example](./packages/contracts/.env.example):

```shell
cd packages/contracts
cp .env.example .env
```

Edit `.env` and set your config:

| Var                      | Description              | Default values                                 |
| ------------------------ | ------------------------ | ---------------------------------------------- |
| L1_PROVIDER_URL          | L1 provider URL          | https://goerli.infura.io/v3/<INFURA_KEY>       |
| L1_ENS_DOMAIN            | L1 ENS name              | lineatest.eth                                  |
| GATEWAY_URL              | Primary gateway URL      | http://localhost:8080/{sender}/{data}.json     |
| L2_PROVIDER_URL          | L2 provider URL          | https://linea-goerli.infura.io/v3/<INFURA_KEY> |
| L2_ENS_SUBDOMAIN_TEST    | L2 ENS name              | julink.lineatest.eth                           |
| L2_RESOLVER_NFT_NAME     | L2 Resolver NFT name     | Lineatest                                      |
| L2_RESOLVER_NFT_SYMBOL   | L2 Resolver NFT symbol   | LTST                                           |
| L2_RESOLVER_NFT_BASE_URI | L2 Resolver NFT Base URI | http://localhost:3000/metadata/                |
| PRIVATE_KEY              | Wallet private key       |                                                |
| ETHERSCAN_API_KEY        | Etherscan API key        |                                                |

For local/L2 mode, `L1_PROVIDER_URL` is not required.

Compile smart contracts:

```shell
yarn compile
```

Deploy L2 contracts first:

```shell
npx hardhat run --network goerliLinea scripts/deployL2.ts
```

> **_Imporant:_** Wait 10 minutes for Linea to synchronize with Goerli. This will allow the domain registered on Linea to be recognized by the state hash written in Goerli.

Get the `L2_RESOLVER_ADDRESS` resolver address, then deploy L1 contracts:

```
L2_RESOLVER_ADDRESS=$L2_RESOLVER_ADDRESS npx hardhat run --network localhost scripts/deployL1.ts
```

### Start Gateway server

Once smart contracts are deployed, start the gateway:

```shell
cd ../gateway
yarn install
yarn build
yarn start --l2_resolver_address $L2_RESOLVER_ADDRESS --l1_provider_url http://127.0.0.1:8545/ --l2_provider_url $L2_PROVIDER_URL
```

### Run Client test script

In a third terminal, run the demo app:

```shell
cd packages/clients
yarn install
yarn build
yarn start julink.lineatest.eth
```

If successful, it should show the following output:

```shell
ethAddress         0xF110a41f75edEb224227747b64Be7f6A7f140abc
```

### Unit tests

```shell
cd packages/contracts
yarn test
```

### Test coverage

This project uses the Hardhat plugin [solidity-coverage](https://github.com/sc-forks/solidity-coverage/blob/master/HARDHAT_README.md) to assess the overall coverage of the unit tests.
To generate a boilerplate report, use the following command:

```shell
yarn coverage
```

## How to deploy to public net (goerli for example)

Deploy L2 contracts first:

```shell
npx hardhat run --network goerliLinea scripts/deployL2.ts
```

Get the `L2_RESOLVER_ADDRESS` resolver address, then deploy L1 contracts:

```
L2_RESOLVER_ADDRESS=$L2_RESOLVER_ADDRESS npx hardhat run --network goerli scripts/deployL1.ts
```

## Deployed contracts

- Goerli resolver stub = -
- Linea Goerli resolver = 0xCcA59f9eaa814Bedd0d3e7C41b7Bc624BB6fDd37
- Gateway = https://ensgw1.dev.linea.build/{sender}/{data}.json
- goerli test domain = linearesolver.eth

## Deploy gateway

Create secret.yaml and update credentials:

```
cd gateway
cp secret.yaml.org secret.yaml
```

Deploy to app engine:

```
gcloud app deploy goeril.app.yml
```
