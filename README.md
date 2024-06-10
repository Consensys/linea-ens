# Linea Name Service

This repository contains smart contracts and a Node.js Gateway server that allow storing ENS names on Linea using [EIP 3668](https://eips.ethereum.org/EIPS/eip-3668) and [ENSIP 10](https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution).
Also contain a frontend adapted from ENS's frontend to interact with the deployed contract, to create and manage domains on Linea.

## Requirements

- NodeJs v18.x.
- pnpm version > 8
- yarn for the l2-contracts package only

## Packages

### l1/l2 contracts

The l1-contracts intented to be deployed on L1 (Ethereum) implements the proposed protocol, with functions to return the gateway address and required prefix for a query, and to verify the response from the gateway.

The l2-contracts intented to be deployed on L2 (Linea) stores and returns the data necessary to resolve an domain name.

More Smart Contracts documentation available in [./packages/l1-contracts/README.md](./packages/l1-contracts/README.md) and [./packages/l2-contracts/README.md](./packages/l2-contracts/README.md)

### gateway

A node-based gateway server that answers queries for L2 Gateway function calls relating to Linea-based L2 resolvers.

### ens-app-v3

The Linea NS frontend forked from [ens-app-v3](https://github.com/ensdomains/ens-app-v3)

### ens-subgraph

The Linea NS subgrah consumed by the frontend, adapted from [ens-subgraph](https://github.com/ensdomains/ens-subgraph)

### linea-verifier

The linea verifier contracts are responsible for checking the proofs and values returned by the gateway for specific slots values stored on Linea, adapted from [evm-verifier](https://github.com/ensdomains/evmgateway/tree/main/evm-verifier)

### poh-verifier

A NestJS API responsible for signing a message aknowledging an address has passed the POH process, the signature created is then checked by the poh verifier in the l2-contracts.

## Deployed contracts

Check the deployment folders in [./packages/l1-contracts/deployments](./packages/l1-contracts/deployments) and [./packages/l2-contracts/deployments](./packages/l2-contracts/deployments)

For detailed information about each package, please check their own Readme file.
