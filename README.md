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

### Create a domain name on ENS goerli L1

Go to https://app.ens.domains/ and register a new test domain on goerli L1 that will be your subdomain on Linea goerli.

### Setup env

In `packages/contracts` the .env.example and replace the values:

```shell
cd packages/contracts
cp .env.example .env
```

Edit `.env` copy set your config:

| Var                      | Description                                                      | Default values                                 |
| ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------- |
| L1_PROVIDER_URL          | L1 provider URL                                                  | https://goerli.infura.io/v3/<INFURA_KEY>       |
| L1_ENS_DOMAIN            | L1 ENS name you created                                          | lineatest.eth                                  |
| GATEWAY_URL              | Local gateway                                                    | http://localhost:8080/{sender}/{data}.json     |
| L2_PROVIDER_URL          | L2 provider URL                                                  | https://linea-goerli.infura.io/v3/<INFURA_KEY> |
| L2_ENS_SUBDOMAIN_TEST    | L2 ENS name                                                      | test.lineatest.eth                             |
| L2_RESOLVER_NFT_NAME     | L2 Resolver NFT name                                             | Lineatest                                      |
| L2_RESOLVER_NFT_SYMBOL   | L2 Resolver NFT symbol                                           | LTST                                           |
| L2_RESOLVER_NFT_BASE_URI | L2 Resolver NFT Base URI                                         | http://localhost:3000/metadata/                |
| L2_RESOLVER_ADDRESS      | L2 Resolver address you deploy later                             |                                                |
| PRIVATE_KEY              | Wallet private key(The one used to create the domain name on L1) |                                                |
| ETHERSCAN_API_KEY        | Etherscan API key to verify contracts when deploying on L1       |                                                |
| LINEASCAN_API_KEY        | Lineascan API key to verify contracts when deploying on L2       |                                                |

### Setup local node

In a terminal, setup a forked L1 local node:

```shell
cd packages/contracts
yarn install
yarn hardhat node --fork <L1_PROVIDER_URL>
```

`L1_PROVIDER_URL` is the RPC endpoint for the L1 chain to be forked.

### Deploy contracts

In a second terminal, compile smart contracts:

```shell
yarn compile
```

Deploy L2 contracts first:

```shell
npx hardhat run --network goerliLinea scripts/deployL2.ts
```

You should get the result:

```shell
LineaResolver deployed to, L2_RESOLVER_ADDRESS: `YOUR_CONTRACT_ADDRESS`
Subdomain minted: `L2_ENS_SUBDOMAIN_TEST`
```

> **_Imporant:_** You'll have to wait about 12 hours for Linea to finalize the block on which your contract has been deployed. This will allow the domain registered on Linea to be recognized by the state hash written in Goerli. This mean you can continue the deployments but you'll have to wait for the final step to test.

Get the `L2_RESOLVER_ADDRESS` resolver address and add it to your .env, then deploy L1 contracts:

```shell
npx hardhat run --network localhost scripts/deployL1.ts
```

You should get the result:

```shell
LineaResolverStub deployed to `YOUR_CONTRACT_ADDRESS`
{ name: `L1_ENS_DOMAIN` }
L1 ENS name: test-linea.eth , set to LineaResolverStub: `YOUR_CONTRACT_ADDRESS`
```

### Start Gateway server

In `packages/gateway` copy .env.example :

```shell
cd packages/gateway
cp .env.example .env
```

Edit `.env` and replace the values:

| Var                 | Description                                 | Default values                                 |
| ------------------- | ------------------------------------------- | ---------------------------------------------- |
| L2_PROVIDER_URL     | L2 provider URL                             | https://linea-goerli.infura.io/v3/<INFURA_KEY> |
| L2_RESOLVER_ADDRESS | L2 Resolver address you deployed previously |                                                |

Start the gateway:

```shell
cd ../gateway
yarn install
yarn build && yarn start
```

### Run Client test script

In a third terminal, run the demo app(Replace `L2_ENS_SUBDOMAIN_TEST` by your value ):

```shell
cd packages/clients
yarn install
yarn build && yarn start `L2_ENS_SUBDOMAIN_TEST`
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

TBD

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
