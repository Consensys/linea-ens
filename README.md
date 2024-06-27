# Linea Name Service

This repository contains smart contracts and a Node.js Gateway server that allow storing ENS names on Linea using [EIP 3668](https://eips.ethereum.org/EIPS/eip-3668) and [ENSIP 10](https://docs.ens.domains/ens-improvement-proposals/ensip-10-wildcard-resolution).
Also contain a frontend adapted from [ENS's frontend](https://github.com/ensdomains/ens-app-v3) to interact with the deployed contract, to create and manage domains on Linea.

It also implements a proof verifier that allows L1 smart contracts to fetch and verify any state from Linea.

- Anyone can operate their own gateway, but...
- Only one gateway needs to be operated, regardless of the applications requesting data from it.
- Gateways do not need to be trusted; their responses are fully verified on L1.
- Contracts can fetch Linea state using a simple builder interface and callbacks.
- Contracts can change targets just by swapping out the address of a verifier contract for another.

While this functionality is written primarily with read calls in mind, it also functions for transactions; using a compliant
library like Ethers, a transaction that includes relevant Linea proofs can be generated and signed.

## Usage

1.  Have your contract extend `EVMFetcher`.
2.  In a view/pure context, use `EVMFetcher` to fetch the value of slots from another contract (potentially on another chain). Calling `EVMFetcher.fetch()` terminates execution and generates a callback to the same contract on a function you specify.
3.  In the callback function, use the information from the relevant slots as you see fit.

## Example

The example below fetches another contract's storage value `testUint`.

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { EVMFetcher } from '@ensdomains/evm-verifier/contracts/EVMFetcher.sol';
import { EVMFetchTarget } from '@ensdomains/evm-verifier/contracts/EVMFetchTarget.sol';
import { IEVMVerifier } from '@ensdomains/evm-verifier/contracts/IEVMVerifier.sol';

contract TestL2 {
    uint256 testUint; // Slot 0

    constructor() {
        testUint = 42;
    }
}

contract TestL1 is EVMFetchTarget {
    using EVMFetcher for EVMFetcher.EVMFetchRequest;

    IEVMVerifier verifier;
    address target;

    constructor(IEVMVerifier _verifier, address _target) {
        verifier = _verifier;
        target = _target;
    }

    function getTestUint() public view returns(uint256) {
        EVMFetcher.newFetchRequest(verifier, target)
            .getStatic(0)
            .fetch(this.getSingleStorageSlotCallback.selector, "");
    }

    function getSingleStorageSlotCallback(bytes[] memory values, bytes memory) public pure returns(uint256) {
        return uint256(bytes32(values[0]));
    }
}
```

## Requirements

- NodeJs v18.x.
- pnpm v9.x
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
