// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract RollupMock {
    function currentL2BlockNumber() public pure returns (uint256) {
        return 1195643;
    }

    function stateRootHashes(
        uint256 blockNumber
    ) public pure returns (bytes32) {
        return
            0x04fca708fc7454f3cfb3704b558c8b517ff418eb49da1e5a154445d7a789df4a;
    }
}
