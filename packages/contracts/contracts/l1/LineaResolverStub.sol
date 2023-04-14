// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import { Lib_OVMCodec } from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import { Lib_SecureMerkleTrie } from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import { Lib_RLPReader } from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import { Lib_BytesUtils } from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";

struct L2StateProof {
  bytes32 blockHash;
  bytes encodedBlockArray;
  bytes accountProof;
  bytes32 stateRoot;
  bytes tokenIdStorageProof;
  bytes ownerStorageProof;
}

interface IResolverService {
  function resolve(
    bytes calldata name,
    bytes calldata data
  ) external view returns (L2StateProof memory proof);
}

interface IExtendedResolver {
  function resolve(
    bytes memory name,
    bytes memory data
  ) external view returns (bytes memory);
}

interface ISupportsInterface {
  function supportsInterface(bytes4 interfaceID) external pure returns (bool);
}

abstract contract SupportsInterface is ISupportsInterface {
  function supportsInterface(
    bytes4 interfaceID
  ) public pure virtual override returns (bool) {
    return interfaceID == type(ISupportsInterface).interfaceId;
  }
}

contract LineaResolverStub is IExtendedResolver, SupportsInterface {
  string[] public gateways;
  address public l2resolver;

  error OffchainLookup(
    address sender,
    string[] urls,
    bytes callData,
    bytes4 callbackFunction,
    bytes extraData
  );

  constructor(string[] memory _gateways, address _l2resolver) {
    gateways = _gateways;
    l2resolver = _l2resolver;
  }

  /**
   * Resolves a name, as specified by ENSIP 10.
   * @param name The DNS-encoded name to resolve.
   * @param data The ABI encoded data for the underlying resolution function (Eg, addr(bytes32), text(bytes32,string), etc).
   * @return The return data, ABI encoded identically to the underlying function.
   */
  function resolve(
    bytes calldata name,
    bytes calldata data
  ) external view override returns (bytes memory) {
    bytes memory callData = abi.encodeWithSelector(
      IResolverService.resolve.selector,
      name,
      data
    );

    revert OffchainLookup(
      address(this),
      gateways,
      callData,
      LineaResolverStub.resolveWithProof.selector,
      data
    );
  }

  /**
   * Callback used by CCIP read compatible clients to verify and parse the response.
   */
  function resolveWithProof(
    bytes calldata response,
    bytes calldata extraData
  ) external view returns (bytes memory) {
    // We only resolve if the addr(bytes32) is called otherwise we simply return an empty response
    bytes4 signature = bytes4(extraData[0:4]);
    if (signature != bytes4(0x3b3b57de)) {
      return abi.encode("");
    }

    // This is the hash name of the domain name
    bytes32 node = abi.decode(extraData[4:], (bytes32));

    L2StateProof memory proof = abi.decode(response, (L2StateProof));
    // bytes32 node = abi.decode(extraData, (bytes32));
    // step 1: check blockHash against encoded block array
    require(
      proof.blockHash == keccak256(proof.encodedBlockArray),
      "blockHash encodedBlockArray mismatch"
    );

    // step 2: check storage values, get itemId first and then get the address result
    bytes32 tokenIdSlot = keccak256(abi.encodePacked(node, uint256(6)));
    bytes32 tokenId = getStorageValue(
      l2resolver,
      tokenIdSlot,
      proof.stateRoot,
      proof.accountProof,
      proof.tokenIdStorageProof
    );

    bytes32 ownerSlot = keccak256(abi.encodePacked(tokenId, uint256(2)));
    bytes32 owner = getStorageValue(
      l2resolver,
      ownerSlot,
      proof.stateRoot,
      proof.accountProof,
      proof.ownerStorageProof
    );

    return abi.encode(owner);
  }

  function getStorageValue(
    address target,
    bytes32 slot,
    bytes32 stateRoot,
    bytes memory stateTrieWitness,
    bytes memory storageTrieWitness
  ) internal pure returns (bytes32) {
    (bool exists, bytes memory encodedResolverAccount) = Lib_SecureMerkleTrie
      .get(abi.encodePacked(target), stateTrieWitness, stateRoot);
    require(exists, "Account does not exist");
    Lib_OVMCodec.EVMAccount memory account = Lib_OVMCodec.decodeEVMAccount(
      encodedResolverAccount
    );
    (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie
      .get(abi.encodePacked(slot), storageTrieWitness, account.storageRoot);
    require(storageExists, "Storage value does not exist");
    return toBytes32PadLeft(Lib_RLPReader.readBytes(retrievedValue));
  }

  // Ported old function from Lib_BytesUtils.sol
  function toBytes32PadLeft(
    bytes memory _bytes
  ) internal pure returns (bytes32) {
    bytes32 ret;
    uint256 len = _bytes.length <= 32 ? _bytes.length : 32;
    assembly {
      ret := shr(mul(sub(32, len), 8), mload(add(_bytes, 32)))
    }
    return ret;
  }

  function supportsInterface(
    bytes4 interfaceID
  ) public pure override returns (bool) {
    return
      interfaceID == type(IExtendedResolver).interfaceId ||
      super.supportsInterface(interfaceID);
  }
}
