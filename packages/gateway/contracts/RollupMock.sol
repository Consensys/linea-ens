// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RollupMock {
    function currentL2BlockNumber() public pure returns (uint256) {
        return 4120264;
    }

    function stateRootHashes(
        uint256 blockNumber
    ) public pure returns (bytes32) {
        return
            0x03d0b763f587ee91006fda775636a2d190d9e3037807a39aa566c5f13ba73965;
    }
}