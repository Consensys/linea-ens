// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {LineaSparseProofVerifier} from "linea-verifier/contracts/LineaSparseProofVerifier.sol";

contract Verifier is LineaSparseProofVerifier {
    constructor(
        string[] memory urls,
        address rollup
    ) LineaSparseProofVerifier(urls, rollup) {}
}
