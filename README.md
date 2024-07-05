# Linea ENS

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
- yarn for the linea-ens-contracts package only

## Packages

### linea-ens-resolver

The linea-ens-resolver contract that is built on top of [linea-state-verifier](./packages/packages/linea-state-verifier) and verify Linea ENS data (domain names, metadata etc).

More documentation available in [linea-ens-resolver/README.md](./packages/linea-ens-resolver/README.md)

### linea-ens-contracts

The linea-ens-contracts contracts intented to be deployed on L2 (Linea) stores and returns the data necessary to resolve an domain name and more data related to ENS.

More documentation available in [linea-ens-contracts/README.md](./packages/linea-ens-contracts/README.md)

### linea-ccip-gateway

A node-based gateway server that answers queries from L1 Gateway function calls relating to Linea-based L2 contracts.

### linea-ens-app

The Linea ENS frontend forked from [ens-app-v3](https://github.com/ensdomains/ens-app-v3)

### linea-ens-subgraph

The Linea ENS subgrah consumed by the frontend, adapted from [ens-subgraph](https://github.com/ensdomains/ens-subgraph)

### linea-state-verifier

The linea state verifier contracts are responsible for checking values using sparse merkle proofs returned by the linea-ccip-gateway for specific slots values stored on Linea, adapted from [evm-verifier](https://github.com/ensdomains/evmgateway/tree/main/evm-verifier)

### poh-signer-api

A NestJS API responsible for signing a message aknowledging an address has passed the POH process, the signature created is then checked by the poh signer api in the linea-ens-contracts.

## Deployed contracts

Check the deployment folders in [./packages/linea-ens-resolver/deployments](./packages/linea-ens-resolver/deployments) and [./packages/linea-ens-contracts/deployments](./packages/linea-ens-contracts/deployments)

For detailed information about each package, please check their own Readme file.
