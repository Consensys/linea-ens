// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract RollupMock {
    function currentL2BlockNumber() public pure returns (uint256) {
        return 261878;
    }

    function stateRootHashes(
        uint256 blockNumber
    ) public pure returns (bytes32) {
        return
            0x12419e508ed1e5e1f47d8f41011909eefb35dbebcf37b797ef9f4a6c1871fb08;
    }
}
