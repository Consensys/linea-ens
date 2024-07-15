// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract RollupMock {
    event DataFinalized(
        uint256 indexed lastBlockFinalized,
        bytes32 indexed startingRootHash,
        bytes32 indexed finalRootHash,
        bool withProof
    );

    uint256 public currentL2BlockNumber;
    mapping(uint256 blockNumber => bytes32 stateRootHash)
        public stateRootHashes;

    constructor(uint256 _currentL2BlockNumber, bytes32 _currentStateRootHash) {
        currentL2BlockNumber = _currentL2BlockNumber;
        stateRootHashes[currentL2BlockNumber] = _currentStateRootHash;

        emit DataFinalized(
            _currentL2BlockNumber,
            _currentStateRootHash,
            _currentStateRootHash,
            false
        );
    }
}
