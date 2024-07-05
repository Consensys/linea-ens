# linea-ccip-gateway

Adapted from EVM gateway https://github.com/ensdomains/evmgateway for fetching data on Linea along with Sparse Merkle Proofs and return it to the L1 callback function.

## Start dev env

```shell
cp .env.example .env
pnpm i
pnpm build
pnpm start
```

## Build

```shell
pnpm build
```

### Tests

```shell
pnpm i
pnpm compile
pnpm test
```
