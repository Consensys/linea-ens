// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IEVMVerifier} from "linea-verifier/contracts/IEVMVerifier.sol";
import {StorageProofStruct, AccountProofStruct, EVMProofHelper} from "linea-verifier/contracts/LineaProofHelper.sol";
import "hardhat/console.sol";

interface IRollup {
    function stateRootHashes(
        uint256 l2blockNumber
    ) external view returns (bytes32);
}

contract LineaVerifier is IEVMVerifier {
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
        console.log(blockNo);
        bytes32 stateRoot = IRollup(_rollup).stateRootHashes(blockNo);
        require(
            stateRoot != bytes32(0),
            "LineaResolverStub: invalid state root"
        );

        return
            EVMProofHelper.getStorageValues(
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
