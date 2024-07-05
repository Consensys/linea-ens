// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract RollupMock {
    uint256 public currentL2BlockNumber;
    mapping(uint256 blockNumber => bytes32 stateRootHash)
        public stateRootHashes;

    constructor(uint256 _currentL2BlockNumber, bytes32 _currentStateRootHash) {
        currentL2BlockNumber = _currentL2BlockNumber;
        stateRootHashes[currentL2BlockNumber] = _currentStateRootHash;
    }
}
