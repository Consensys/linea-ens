# Linea Resolver

This repository contains smart contracts and a node.js gateway server that together allow storing ENS names on Linea using [EIP 3668](https://eips.ethereum.org/EIPS/eip-3668) and [ENSIP 10](https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution).

## Test in a mixed local/L2 mode

### Setup local node

In a terminal, setup a local node:

```bash
cd packages/contracts
yarn install
yarn hardhat node --fork GOERLI_URL
```

`GOERLI_URL` is described in the config section bellow.

### Deploy contracts

In second terminal, deploy L1 and L2 smart contracts.

Set your `.env` config file. You can copy [env.example](./packages/contracts/.env.example):

```bash
cd packages/contracts
cp .env.example .env
```

Edit `.env` and set your config:

| Var               | Description               | Default values                                                    |
| ----------------- | ------------------------- | ----------------------------------------------------------------- |
| GOERLI_URL        | Goerli provider URL       | https://goerli.infura.io/v3/<INFURA_KEY>                          |
| GOERLI_LINEA_URL  | Linea Goerli provider URL | https://consensys-zkevm-goerli-prealpha.infura.io/v3/<INFURA_KEY> |
| PRIVATE_KEY       | Wallet private key        |                                                                   |
| ETHERSCAN_API_KEY | Etherscan API key         |                                                                   |
| L1_ENS_NAME       | L1 ENS name               | lineatest.eth                                                     |
| L2_ENS_NAME       | L2 ENS name               | julink.lineatest.eth                                              |
| GATEWAY_URL       | Primary gateway URL       | https://www.ensgateway.amineharty.me/{sender}/{data}.json         |

For local/L2 mode, `GOERLI_URL` is not required.

Compile smart contracts:

```bash
yarn hardhat compile
```

Deploy L2 contracts first:

```bash
npx hardhat run --network goerliLinea scripts/deployL2.ts
```

> **_Imporant:_** Wait 10 minutes for Linea to synchronize with Goerli. This will allow the domain registered on Linea to be recognized by the state hash written in Goerli.

Get the `L2_RESOLVER_ADDRESS` resolver address, then deploy L1 contracts:

```
L2_RESOLVER_ADDRESS=$L2_RESOLVER_ADDRESS npx hardhat run --network localhost scripts/deployL1.ts
```

### Start Gateway server

Once smart contracts are deployed, start the gateway:

```bash
cd ../gateway
yarn install
yarn build
yarn start --l2_resolver_address $L2_RESOLVER_ADDRESS --l1_provider_url http://127.0.0.1:8545/ --l2_provider_url $GOERLI_LINEA_URL
```

### Run Client test script

In a third terminal, run the demo app:

```bash
cd packages/clients
yarn install
yarn start julink.lineatest.eth
```

If successful, it should show the following output:

```bash
ethAddress         0xF110a41f75edEb224227747b64Be7f6A7f140abc
```

## How to deploy to public net (goerli for example)

## Deployed contracts

- Linea goerli resolver = 0x176569440293dF1fA85D0Eb342A92c6470D662f9
- goerli (gateway points to '[...]' ) = [...]
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

yarn start --l2_resolver_address $L2_RESOLVER_ADDRESS --helper_address $HELPER_ADDRESS --l1_provider_url https://goerli.infura.io/v3/<INFURA_KEY> --l2_provider_url https://goerli.infura.io/v3/<INFURA_KEY> --l1_chain_id 5 --l2_chain_id 5
