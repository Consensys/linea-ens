// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract RollupMock {
    function currentL2BlockNumber() public pure returns (uint256) {
        return 443435;
    }

    function stateRootHashes(
        uint256 blockNumber
    ) public pure returns (bytes32) {
        return
            0x0e080582960965e3c180b1457b16da48041e720af628ae6c1725d13bd98ba9f0;
    }
}
