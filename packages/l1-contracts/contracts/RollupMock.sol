// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract RollupMock {
    function currentL2BlockNumber() public pure returns (uint256) {
        return 377874;
    }

    function stateRootHashes(
        uint256 blockNumber
    ) public pure returns (bytes32) {
        return
            0x0b4ca6ce09f94a09231d6a751adb34e5a48b4f791c0f066056c8ad9acff0f7ca;
    }
}
