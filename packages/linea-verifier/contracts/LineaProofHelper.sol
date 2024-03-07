// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {SparseMerkleProof} from "./lib/SparseMerkleProof.sol";
import "hardhat/console.sol";

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
}

uint8 constant OP_CONSTANT = 0x00;
uint8 constant OP_BACKREF = 0x20;
uint8 constant FLAG_DYNAMIC = 0x01;

library LineaProofHelper {
    error AccountNotFound(address);
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

    // function getDynamicValue(uint256 slot, bytes32 value) private pure {
    //     uint256 firstValue = uint256(value);
    //     if (firstValue & 0x01 == 0x01) {
    //         // Long value: first slot is `length * 2 + 1`, following slots are data.
    //         uint256 length = (firstValue - 1) / 2;
    //         slot = uint256(keccak256(abi.encodePacked(slot)));
    //         // This is horribly inefficient - O(n^2). A better approach would be to build an array of words and concatenate them
    //         // all at once, but we're trying to avoid writing new library code.
    //         while (length > 0) {
    //             if (length < 32) {
    //                 slot++;
    //                 length = 0;
    //             } else {
    //                 slot++;
    //                 length -= 32;
    //             }
    //         }
    //     }
    // }

    function getDynamicValue(
        uint256 slot,
        uint256 proofIdx,
        StorageProofStruct[] memory storageProofs,
        SparseMerkleProof.Account memory account
    ) private pure returns (bytes memory value, uint256 newProofIdx) {
        bytes32 firstValue = storageProofs[proofIdx].proof.value;
        verifyStorageProof(
            account,
            storageProofs[proofIdx].leafIndex,
            storageProofs[proofIdx].proof.proofRelatedNodes,
            firstValue,
            bytes32(slot)
        );
        uint256 firstValueUint = uint256(firstValue);
        proofIdx++;
        if (firstValueUint & 0x01 == 0x01) {
            // Long value: first slot is `length * 2 + 1`, following slots are data.
            uint256 length = (firstValueUint - 1) / 2;
            value = "";
            slot = uint256(keccak256(abi.encodePacked(slot)));
            // This is horribly inefficient - O(n^2). A better approach would be to build an array of words and concatenate them
            // all at once, but we're trying to avoid writing new library code.
            while (length > 0) {
                verifyStorageProof(
                    account,
                    storageProofs[proofIdx].leafIndex,
                    storageProofs[proofIdx].proof.proofRelatedNodes,
                    storageProofs[proofIdx].proof.value,
                    bytes32(slot)
                );
                console.log("proofIdx");
                console.log(proofIdx);
                if (length < 32) {
                    slot++;
                    value = bytes.concat(
                        value,
                        sliceBytes(
                            abi.encode(storageProofs[proofIdx++].proof.value),
                            0,
                            length
                        )
                    );
                    length = 0;
                } else {
                    slot++;
                    value = bytes.concat(
                        value,
                        storageProofs[proofIdx++].proof.value
                    );
                    length -= 32;
                }
            }
            return (value, proofIdx);
        } else {
            uint256 length = (firstValueUint & 0xFF) / 2;
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
        AccountProofStruct memory accountProof,
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
        bytes32 key
    ) private pure {
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
        AccountProofStruct memory accountProof,
        StorageProofStruct[] memory storageProofs
    ) internal pure returns (bytes[] memory values) {
        verifyAccountProof(accountProof, stateRoot);
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
                verifyStorageProof(
                    account,
                    storageProofs[proofIdx].leafIndex,
                    storageProofs[proofIdx].proof.proofRelatedNodes,
                    storageProofs[proofIdx].proof.value,
                    bytes32(slot)
                );
                values[i] = abi.encode(storageProofs[proofIdx++].proof.value);
                if (values[i].length > 32) {
                    revert InvalidSlotSize(values[i].length);
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
