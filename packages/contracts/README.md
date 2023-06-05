# Linea ENS Resolver

## Documentation

Linea ENS Resolver allows to resolve ENS domains on Linea.

Deployment documentation available in [README.md](./../../README.md)

## Install

### Packages

To install packages, execute:

```shell
yarn
```

## Development

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
