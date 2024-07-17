// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IEVMVerifier} from "./IEVMVerifier.sol";
import {StorageProofStruct, AccountProofStruct, LineaProofHelper} from "./LineaProofHelper.sol";

interface IRollup {
    function stateRootHashes(
        uint256 l2blockNumber
    ) external view returns (bytes32);

    function currentL2BlockNumber() external view returns (uint256);
}

contract LineaSparseProofVerifier is IEVMVerifier {
    string[] public _gatewayURLs;
    address public _rollup;

    constructor(string[] memory urls, address rollup) {
        _gatewayURLs = urls;
        _rollup = rollup;
    }

    function getStorageValues(
        address target,
        bytes32[] memory commands,
        bytes[] memory constants,
        bytes memory proof,
        uint256 acceptedL2BlockRangeLength
    ) external view returns (bytes[] memory values) {
        (
            uint256 blockNo,
            AccountProofStruct memory accountProof,
            StorageProofStruct[] memory storageProofs
        ) = abi.decode(
                proof,
                (uint256, AccountProofStruct, StorageProofStruct[])
            );

        // Check that the L2 block number used is a recent one and is part of the range accepted
        uint256 currentL2BlockNumber = IRollup(_rollup).currentL2BlockNumber();
        require(
            (currentL2BlockNumber <= acceptedL2BlockRangeLength &&
                blockNo <= currentL2BlockNumber) ||
                (blockNo >= currentL2BlockNumber - acceptedL2BlockRangeLength),
            "LineaSparseProofVerifier: block not in range accepted"
        );

        bytes32 stateRoot = IRollup(_rollup).stateRootHashes(blockNo);
        require(
            stateRoot != bytes32(0),
            "LineaSparseProofVerifier: invalid state root"
        );

        return
            LineaProofHelper.getStorageValues(
                target,
                commands,
                constants,
                stateRoot,
                accountProof,
                storageProofs
            );
    }

    function gatewayURLs() external view override returns (string[] memory) {
        return _gatewayURLs;
    }
}
