// contracts/test/MockPohVerifier.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../../../contracts/ethregistrar/PohVerifier.sol";

contract MockPohVerifier is PohVerifier {
    function verify(bytes memory signature, address human) public pure override returns (bool) {
        return true; // Always return true for testing
    }
}