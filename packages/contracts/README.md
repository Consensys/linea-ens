# Linea ENS Resolver

## Documentation

Linea ENS Resolver allows to resolve ENS domains on Linea.

## Install

### Packages

To install packages, execute:

```shell
yarn
```

### Config

To setup config, copy the `.env.example` to `.env`, for example:

```shell
cp .env.example .env
```

Edit `.env` and add your configuration values.

| Var               | Description               | Default values                                            |
| ----------------- | ------------------------- | --------------------------------------------------------- |
| GOERLI_URL        | Goerli provider URL       | https://goerli.infura.io/v3/<INFURA_KEY>                  |
| GOERLI_LINEA_URL  | Linea Goerli provider URL | https://linea-goerli.infura.io/v3/<INFURA_KEY>            |
| PRIVATE_KEY       | Wallet private key        |                                                           |
| ETHERSCAN_API_KEY | Etherscan API key         |                                                           |
| L1_ENS_NAME       | L1 ENS name               | lineatest.eth                                             |
| L2_ENS_NAME       | L2 ENS name               | julink.lineatest.eth                                      |
| GATEWAY_URL       | Primary gateway URL       | https://www.ensgateway.amineharty.me/{sender}/{data}.json |

## Deploy

### On mixed local/L2 mode

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

| Var               | Description               | Default values                                            |
| ----------------- | ------------------------- | --------------------------------------------------------- |
| GOERLI_URL        | Goerli provider URL       | https://goerli.infura.io/v3/<INFURA_KEY>                  |
| GOERLI_LINEA_URL  | Linea Goerli provider URL | https://linea-goerli.infura.io/v3/<INFURA_KEY>            |
| PRIVATE_KEY       | Wallet private key        |                                                           |
| ETHERSCAN_API_KEY | Etherscan API key         |                                                           |
| L1_ENS_NAME       | L1 ENS name               | lineatest.eth                                             |
| L2_ENS_NAME       | L2 ENS name               | julink.lineatest.eth                                      |
| GATEWAY_URL       | Primary gateway URL       | https://www.ensgateway.amineharty.me/{sender}/{data}.json |

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

### On a Goerli Testnet network

[...]

### Development

### Compile

To compile smart contracts, execute:

```shell
yarn hardhat compile
```

### Testing

To run tests, execute:

```shell
yarn test
```

or

```shell
npx hardhat test
```

To run tests on only one file, execute:

```shell
npx hardhat test test/L1USDCBridge.ts
```

### Test coverage

This project uses the Hardhat plugin [solidity-coverage](https://github.com/sc-forks/solidity-coverage/blob/master/HARDHAT_README.md) to assess the overall coverage of the unit tests.
To generate a boilerplate report, use the following command:

```shell
yarn coverage
```

or

```shell
npx hardhat coverage --solcoverjs ./.solcover.js
```

The report will be generated in the `coverage` folder at the root of the repository. To visualize it in your web browser, you can use the `coverage/index.html` file.
Note: the second command line might not work if the folder `coverage` already exists. If you encounter an issue, please delete the whole `coverage` folder and let hardhat-coverage regenerate a new one.

### Contract verification on Etherscan

```shell
 npx hardhat verify --network NETWORK DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1" "Constructor argument 2"
```

### Lint Solidity

```bash
yarn lint:sol
```

### Lint TypeScript

```bash
yarn lint:ts
```

### Prettier

Check format code:

```bash
yarn prettier:check
```

Format code:

```bash
yarn prettier
```
