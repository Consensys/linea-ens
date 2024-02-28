// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import { IEVMVerifier } from "./IEVMVerifier.sol";
import { StateProof, ProofStruct, EVMProofHelper } from "./LineaProofHelper.sol";

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
    StateProof memory stateProof = abi.decode(proof, (StateProof));
    bytes32 stateRoot = IRollup(_rollup).stateRootHashes(stateProof.blockNo);
    ProofStruct memory accountProof = stateProof.accountProof;
    ProofStruct[] memory storageProofs = stateProof.storageProofs;

    require(stateRoot != bytes32(0), "LineaResolverStub: invalid state root");

    return
      EVMProofHelper.getStorageValues(
        commands,
        constants,
        stateRoot,
        accountProof,
        storageProofs
      );
  }

  function gatewayURLs() external view override returns (string[] memory) {}
}
