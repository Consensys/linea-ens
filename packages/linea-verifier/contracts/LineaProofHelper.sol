// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import {SparseMerkleProof} from "./lib/SparseMerkleProof.sol";

uint256 constant LAST_LEAF_INDEX = 41;

struct Proof {
    bytes value;
    bytes[] proofRelatedNodes;
}

struct ProofStruct {
    bytes key;
    uint256 leafIndex;
    Proof proof;
}

struct StateProof {
    uint256 blockNo;
    ProofStruct accountProof;
    ProofStruct[] storageProofs;
}

uint8 constant OP_CONSTANT = 0x00;
uint8 constant OP_BACKREF = 0x20;
uint8 constant FLAG_DYNAMIC = 0x01;

library EVMProofHelper {
    error AccountNotFound(address);
    error UnknownOpcode(uint8);
    error InvalidSlotSize(uint256 size);

    function getFixedValue(bytes memory value) private pure returns (bytes32) {
        // RLP encoded storage slots are stored without leading 0 bytes.
        // Casting to bytes32 appends trailing 0 bytes, so we have to bit shift to get the
        // original fixed-length representation back.
        return bytes32(value) >> (256 - 8 * value.length);
    }

    function executeOperation(
        bytes1 operation,
        bytes[] memory constants,
        bytes[] memory values
    ) private pure returns (bytes memory) {
        uint8 opcode = uint8(operation) & 0xe0;
        uint8 operand = uint8(operation) & 0x1f;

        if (opcode == OP_CONSTANT) {
            return constants[operand];
        } else if (opcode == OP_BACKREF) {
            return values[operand];
        } else {
            revert UnknownOpcode(opcode);
        }
    }

    function computeFirstSlot(
        bytes32 command,
        bytes[] memory constants,
        bytes[] memory values
    ) private pure returns (bool isDynamic, uint256 slot) {
        uint8 flags = uint8(command[0]);
        isDynamic = (flags & FLAG_DYNAMIC) != 0;

        bytes memory slotData = executeOperation(command[1], constants, values);
        require(slotData.length == 32, "First path element must be 32 bytes");
        slot = uint256(bytes32(slotData));

        for (uint256 j = 2; j < 32 && command[j] != 0xff; j++) {
            bytes memory index = executeOperation(
                command[j],
                constants,
                values
            );
            slot = uint256(keccak256(abi.encodePacked(index, slot)));
        }
    }

    function getDynamicValue(uint256 slot, bytes memory value) private pure {
        uint256 firstValue = uint256(getFixedValue(value));
        if (firstValue & 0x01 == 0x01) {
            // Long value: first slot is `length * 2 + 1`, following slots are data.
            uint256 length = (firstValue - 1) / 2;
            slot = uint256(keccak256(abi.encodePacked(slot)));
            // This is horribly inefficient - O(n^2). A better approach would be to build an array of words and concatenate them
            // all at once, but we're trying to avoid writing new library code.
            while (length > 0) {
                if (length < 32) {
                    slot++;
                    length = 0;
                } else {
                    slot++;
                    length -= 32;
                }
            }
        }
    }

    function verifyAccountProof(
        ProofStruct memory accountProof,
        bytes32 stateRoot
    ) private pure returns (bool) {
        bool accountProofVerified = SparseMerkleProof.verifyProof(
            accountProof.proof.proofRelatedNodes,
            accountProof.leafIndex,
            stateRoot
        );

        require(
            accountProofVerified,
            "LineaResolverStub: invalid account proof"
        );

        bytes32 hAccountValue = SparseMerkleProof.hashAccountValue(
            accountProof.proof.value
        );

        SparseMerkleProof.Leaf memory accountLeaf = SparseMerkleProof.getLeaf(
            accountProof.proof.proofRelatedNodes[41]
        );

        require(
            accountLeaf.hValue == hAccountValue,
            "LineaResolverStub: account value invalid"
        );

        return true;
    }

    function verifyStorageProof(
        SparseMerkleProof.Account memory account,
        uint256 leafIndex,
        bytes[] memory proof,
        bytes32 value,
        uint256 slot
    ) private pure {
        bytes32 key = keccak256(abi.encode(slot));

        bool storageProofVerified = SparseMerkleProof.verifyProof(
            proof,
            leafIndex,
            account.storageRoot
        );

        require(
            storageProofVerified,
            "LineaResolverStub: invalid storage proof"
        );

        SparseMerkleProof.Leaf memory storageLeaf = SparseMerkleProof.getLeaf(
            proof[LAST_LEAF_INDEX]
        );

        // Verify the key
        bytes32 hKey = SparseMerkleProof.hashStorageValue(key);
        require(storageLeaf.hKey == hKey, "LineaResolverStub: key invalid");

        // Verify the storage value
        bytes32 hValue = SparseMerkleProof.hashStorageValue(value);
        require(
            storageLeaf.hValue == hValue,
            "LineaResolverStub: value invalid"
        );
    }

    function getStorageValues(
        bytes32[] memory commands,
        bytes[] memory constants,
        bytes32 stateRoot,
        ProofStruct memory accountProof,
        ProofStruct[] memory storageProofs
    ) internal pure returns (bytes[] memory values) {
        verifyAccountProof(accountProof, stateRoot);

        SparseMerkleProof.Account memory account = SparseMerkleProof.getAccount(
            accountProof.proof.value
        );

        values = new bytes[](commands.length);
        for (uint256 i = 0; i < storageProofs.length; i++) {
            bytes32 command = commands[i];
            (bool isDynamic, uint256 slot) = computeFirstSlot(
                command,
                constants,
                values
            );
            if (!isDynamic) {
                values[i] = abi.encode(
                    getFixedValue(storageProofs[i].proof.value)
                );
                if (values[i].length > 32) {
                    revert InvalidSlotSize(values[i].length);
                }
            } else {
                getDynamicValue(slot, storageProofs[i].proof.value);
                values[i] = storageProofs[i].proof.value;
            }

            verifyStorageProof(
                account,
                storageProofs[i].leafIndex,
                storageProofs[i].proof.proofRelatedNodes,
                bytes32(storageProofs[i].proof.value),
                slot
            );
        }
    }
}
