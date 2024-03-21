// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {LineaVerifier} from "linea-verifier/contracts/LineaVerifier.sol";

contract Verifier is LineaVerifier {
    constructor(
        string[] memory urls,
        address rollup
    ) LineaVerifier(urls, rollup) {}
}
