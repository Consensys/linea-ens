# Linea POH Signer API

A NestJS API responsible for returning a signature acknowledging an address has passed the POH process.  
Uses the [POH api](https://linea-xp-poh-api.linea.build) to check if an address has a POH.

POH stands for Proof Of Humanity, it respects a set of rules that determines if an address is human or not, a user has to go through a POH process to be marked as POH.

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```
