// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
pragma abicoder v2;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import {Lib_OVMCodec} from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import {Lib_SecureMerkleTrie} from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import {Lib_RLPReader} from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import {Lib_BytesUtils} from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";
struct L2StateProof {
    uint64 nodeIndex;
    bytes32 blockHash;
    bytes sendRoot;
    bytes encodedBlockArray;
    bytes stateTrieWitness;
    bytes32 stateRoot;
    bytes storageTrieWitness;
}

interface IResolverService {
    function addr(bytes32 node)
        external
        view
        returns (L2StateProof memory proof);
}

struct Node {
    // Hash of the state of the chain as of this node
    bytes32 stateHash;
    // Hash of the data that can be challenged
    bytes32 challengeHash;
    // Hash of the data that will be committed if this node is confirmed
    bytes32 confirmData;
    // Index of the node previous to this one
    uint64 prevNum;
    // Deadline at which this node can be confirmed
    uint64 deadlineBlock;
    // Deadline at which a child of this node can be confirmed
    uint64 noChildConfirmedBeforeBlock;
    // Number of stakers staked on this node. This includes real stakers and zombies
    uint64 stakerCount;
    // Number of stakers staked on a child node. This includes real stakers and zombies
    uint64 childStakerCount;
    // This value starts at zero and is set to a value when the first child is created. After that it is constant until the node is destroyed or the owner destroys pending nodes
    uint64 firstChildBlock;
    // The number of the latest child of this node to be created
    uint64 latestChildNumber;
    // The block number when this node was created
    uint64 createdAtBlock;
    // A hash of all the data needed to determine this node's validity, to protect against reorgs
    bytes32 nodeHash;
}

interface IRollup {
    function getNode(uint64 _nodeIndex)
        external
        view
        returns (Node memory);
}

contract LineaResolverStub{
    string[] public gateways;
    address public rollup;
    address public l2resolver;

    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    constructor(
        string[] memory _gateways,
        address _rollup,
        address _l2resolver
    ) {
        gateways = _gateways;
        rollup = _rollup;
        l2resolver = _l2resolver;
    }

    function getl2Resolver() external view returns (address) {
        return l2resolver;
    }

    function addr(bytes32 node) public view returns (address) {
        return _addr(node, LineaResolverStub.addrWithProof.selector);
    }

    function addr(bytes32 node, uint256 coinType)
        public
        view
        returns (bytes memory)
    {
        if (coinType == 60) {
            return
                addressToBytes(
                    _addr(
                        node,
                        LineaResolverStub.bytesAddrWithProof.selector
                    )
                );
        } else {
            return addressToBytes(address(0));
        }
    }

    function _addr(bytes32 node, bytes4 selector)
        private
        view
        returns (address)
    {
        bytes memory callData = abi.encodeWithSelector(
            IResolverService.addr.selector,
            node
        );
        revert OffchainLookup(
            address(this),
            gateways,
            callData,
            selector,
            abi.encode(node)
        );
    }

    function addrWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (address)
    {
        return _addrWithProof(response, extraData);
    }

    function bytesAddrWithProof(
        bytes calldata response,
        bytes calldata extraData
    ) external view returns (bytes memory) {
        return addressToBytes(_addrWithProof(response, extraData));
    }

    function _addrWithProof(bytes calldata response, bytes calldata extraData)
        internal
        view
        returns (address)
    {
        L2StateProof memory proof = abi.decode(response, (L2StateProof));
        bytes32 node = abi.decode(extraData, (bytes32));
        // step 1: check confirmData
        // confirmData is how Arbitrum stores the l2 state in rblock
        bytes32 confirmdata = keccak256(abi.encodePacked(proof.blockHash, proof.sendRoot));
        Node memory rblock = IRollup(rollup).getNode(proof.nodeIndex);
        require(rblock.confirmData == confirmdata, "confirmData mismatch");
        // step 2: check blockHash against encoded block array
        require(proof.blockHash == keccak256(proof.encodedBlockArray), "blockHash encodedBlockArray mismatch");
        // step 3: check storage value from derived value
        bytes32 slot = keccak256(abi.encodePacked(node, uint256(1)));
        bytes32 value = getStorageValue(
            l2resolver,
            slot,
            proof.stateRoot,
            proof.stateTrieWitness,
            proof.storageTrieWitness
        );
        return address(uint160(uint256(value)));
    }

    function getStorageValue(
        address target,
        bytes32 slot,
        bytes32 stateRoot,
        bytes memory stateTrieWitness,
        bytes memory storageTrieWitness
    ) internal pure returns (bytes32) {
        (
            bool exists,
            bytes memory encodedResolverAccount
        ) = Lib_SecureMerkleTrie.get(
                abi.encodePacked(target),
                stateTrieWitness,
                stateRoot
            );
        require(exists, "Account does not exist");
        Lib_OVMCodec.EVMAccount memory account = Lib_OVMCodec.decodeEVMAccount(
            encodedResolverAccount
        );
        (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie
            .get(
                abi.encodePacked(slot),
                storageTrieWitness,
                account.storageRoot
            );
        require(storageExists, "Storage value does not exist");
        return toBytes32PadLeft(Lib_RLPReader.readBytes(retrievedValue));
    }

    // Ported old function from Lib_BytesUtils.sol
    function toBytes32PadLeft(bytes memory _bytes)
        internal
        pure
        returns (bytes32)
    {
        bytes32 ret;
        uint256 len = _bytes.length <= 32 ? _bytes.length : 32;
        assembly {
            ret := shr(mul(sub(32, len), 8), mload(add(_bytes, 32)))
        }
        return ret;
    }

    function addressToBytes(address a) internal pure returns (bytes memory b) {
        b = new bytes(20);
        assembly {
            mstore(add(b, 32), mul(a, exp(256, 12)))
        }
    }
}
