// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IEVMVerifier} from "./IEVMVerifier.sol";
import {StorageProofStruct, AccountProofStruct, LineaProofHelper} from "./LineaProofHelper.sol";

interface IRollup {
    function stateRootHashes(
        uint256 l2blockNumber
    ) external view returns (bytes32);
}

contract LineaSparseProofVerifier is IEVMVerifier {
    string[] public _gatewayURLs;
    address public _rollup;

    constructor(string[] memory urls, address rollup) {
        _gatewayURLs = urls;
        _rollup = rollup;
    }

    function getStorageValues(
        bytes32[] memory commands,
        bytes[] memory constants,
        bytes memory proof
    ) external view returns (bytes[] memory values) {
        (
            uint256 blockNo,
            AccountProofStruct memory accountProof,
            StorageProofStruct[] memory storageProofs
        ) = abi.decode(
                proof,
                (uint256, AccountProofStruct, StorageProofStruct[])
            );

        bytes32 stateRoot = IRollup(_rollup).stateRootHashes(blockNo);
        require(
            stateRoot != bytes32(0),
            "LineaResolverStub: invalid state root"
        );

        return
            LineaProofHelper.getStorageValues(
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
