// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;
import {SparseMerkleProof} from "./lib/SparseMerkleProof.sol";

uint256 constant LAST_LEAF_INDEX = 41;

struct AccountProof {
    bytes value;
    bytes[] proofRelatedNodes;
}

struct StorageProof {
    bytes32 value;
    bytes[] proofRelatedNodes;
}

struct AccountProofStruct {
    address key;
    uint256 leafIndex;
    AccountProof proof;
}

struct StorageProofStruct {
    bytes32 key;
    uint256 leafIndex;
    StorageProof proof;
    bool initialized;
}

uint8 constant OP_CONSTANT = 0x00;
uint8 constant OP_BACKREF = 0x20;
uint8 constant FLAG_DYNAMIC = 0x01;

library LineaProofHelper {
    error UnknownOpcode(uint8);
    error InvalidSlotSize(uint256 size);

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

    function getDynamicValue(
        uint256 slot,
        uint256 proofIdx,
        StorageProofStruct[] memory storageProofs,
        SparseMerkleProof.Account memory account
    ) private pure returns (bytes memory value, uint256 newProofIdx) {
        if (!storageProofs[proofIdx].initialized) {
            return ("", proofIdx++);
        }
        verifyStorageProof(
            account,
            storageProofs[proofIdx].leafIndex,
            storageProofs[proofIdx].proof.proofRelatedNodes,
            storageProofs[proofIdx].proof.value,
            bytes32(slot)
        );
        uint256 firstValue = uint256(storageProofs[proofIdx++].proof.value);
        if (firstValue & 0x01 == 0x01) {
            // Long value: first slot is `length * 2 + 1`, following slots are data.
            slot = uint256(keccak256(abi.encodePacked(slot)));
            value = new bytes(firstValue >> 1);
            uint256 off;
            while (off < value.length) {
                verifyStorageProof(
                    account,
                    storageProofs[proofIdx].leafIndex,
                    storageProofs[proofIdx].proof.proofRelatedNodes,
                    storageProofs[proofIdx].proof.value,
                    bytes32(slot++)
                );
                off += 32;
                bytes32 temp = storageProofs[proofIdx++].proof.value;
                assembly {
                    mstore(add(value, off), temp)
                }
            }
            return (value, proofIdx);
        } else {
            uint256 length = (firstValue & 0xFF) >> 1;
            return (sliceBytes(abi.encode(firstValue), 0, length), proofIdx);
        }
    }

    function sliceBytes(
        bytes memory data,
        uint256 start,
        uint256 length
    ) public pure returns (bytes memory) {
        require(start + length <= data.length, "sliceBytes: out of range");

        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = data[i + start];
        }

        return result;
    }

    function verifyAccountProof(
        address target,
        AccountProofStruct memory accountProof,
        bytes32 stateRoot
    ) private pure returns (bool) {
        // Verify the target contract first against the account proof's last leaf node's hkey
        bytes32 targetHash = SparseMerkleProof.mimcHash(
            abi.encodePacked(target)
        );
        SparseMerkleProof.Leaf memory accountLeaf = SparseMerkleProof.getLeaf(
            accountProof.proof.proofRelatedNodes[LAST_LEAF_INDEX]
        );
        bytes32 hKey = accountLeaf.hKey;

        require(targetHash == hKey, "LineaProofHelper: wrong target");

        // Verify the account's proof itself
        bool accountProofVerified = SparseMerkleProof.verifyProof(
            accountProof.proof.proofRelatedNodes,
            accountProof.leafIndex,
            stateRoot
        );

        bytes32 hAccountValue = SparseMerkleProof.hashAccountValue(
            accountProof.proof.value
        );

        require(
            accountProofVerified && accountLeaf.hValue == hAccountValue,
            "LineaProofHelper: invalid account proof"
        );

        return true;
    }

    function verifyStorageProof(
        SparseMerkleProof.Account memory account,
        uint256 leafIndex,
        bytes[] memory proof,
        bytes32 value,
        bytes32 key
    ) private pure {
        bool storageProofVerified = SparseMerkleProof.verifyProof(
            proof,
            leafIndex,
            account.storageRoot
        );

        SparseMerkleProof.Leaf memory storageLeaf = SparseMerkleProof.getLeaf(
            proof[LAST_LEAF_INDEX]
        );

        // Verify the key
        bytes32 hKey = SparseMerkleProof.hashStorageValue(key);

        // Verify the storage value
        bytes32 hValue = SparseMerkleProof.hashStorageValue(value);
        require(
            storageProofVerified &&
                storageLeaf.hKey == hKey &&
                storageLeaf.hValue == hValue,
            "LineaProofHelper: invalid storage proof"
        );
    }

    function getStorageValues(
        address target,
        bytes32[] memory commands,
        bytes[] memory constants,
        bytes32 stateRoot,
        AccountProofStruct memory accountProof,
        StorageProofStruct[] memory storageProofs
    ) internal pure returns (bytes[] memory values) {
        require(
            commands.length <= storageProofs.length,
            "LineaProofHelper: commands number > storage proofs number"
        );
        verifyAccountProof(target, accountProof, stateRoot);
        SparseMerkleProof.Account memory account = SparseMerkleProof.getAccount(
            accountProof.proof.value
        );
        uint256 proofIdx = 0;
        values = new bytes[](commands.length);
        for (uint256 i = 0; i < commands.length; i++) {
            bytes32 command = commands[i];
            (bool isDynamic, uint256 slot) = computeFirstSlot(
                command,
                constants,
                values
            );
            if (!isDynamic) {
                if (!storageProofs[proofIdx].initialized) {
                    values[i] = abi.encode(0);
                    proofIdx++;
                } else {
                    verifyStorageProof(
                        account,
                        storageProofs[proofIdx].leafIndex,
                        storageProofs[proofIdx].proof.proofRelatedNodes,
                        storageProofs[proofIdx].proof.value,
                        bytes32(slot)
                    );

                    values[i] = abi.encode(
                        storageProofs[proofIdx++].proof.value
                    );

                    if (values[i].length > 32) {
                        revert InvalidSlotSize(values[i].length);
                    }
                }
            } else {
                (values[i], proofIdx) = getDynamicValue(
                    slot,
                    proofIdx,
                    storageProofs,
                    account
                );
            }
        }
    }
}
