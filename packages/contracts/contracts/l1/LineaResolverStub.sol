// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import { Lib_OVMCodec } from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import { Lib_SecureMerkleTrie } from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import { Lib_RLPReader } from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import { Lib_BytesUtils } from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";

struct L2StateProof {
  uint64 nodeIndex;
  bytes32 blockHash;
  bytes sendRoot;
  bytes encodedBlockArray;
  bytes stateTrieWitness;
  bytes32 stateRoot;
  bytes storageTrieWitness;
  bytes node;
  bytes result;
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
  address public rollup;
  address public l2resolver;

  error OffchainLookup(
    address sender,
    string[] urls,
    bytes callData,
    bytes4 callbackFunction,
    bytes extraData
  );

  constructor(string[] memory _gateways, address _rollup, address _l2resolver) {
    gateways = _gateways;
    rollup = _rollup;
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
      abi.encode(name)
    );
  }

  /**
   * Callback used by CCIP read compatible clients to verify and parse the response.
   */
  function resolveWithProof(
    bytes calldata response,
    bytes calldata extraData
  ) external view returns (bytes memory) {
    L2StateProof memory proof = abi.decode(response, (L2StateProof));
    // bytes32 node = abi.decode(extraData, (bytes32));
    // step 2: check blockHash against encoded block array
    require(
      proof.blockHash == keccak256(proof.encodedBlockArray),
      "blockHash encodedBlockArray mismatch"
    );
    // step 3: check storage value from derived value
    // Here the node used should be in extra data but we need to find a way
    // to convert extra data to an ens hashname in solidity, in the meantime we use
    // the node sent by the gateway
    bytes32 slot = keccak256(abi.encodePacked(proof.node, uint256(1)));
    bytes32 value = getStorageValue(
      l2resolver,
      slot,
      proof.stateRoot,
      proof.stateTrieWitness,
      proof.storageTrieWitness
    );

    require(
      keccak256(proof.result) == keccak256(abi.encode(value)),
      "LineaResolverStub: value different from expected result"
    );

    return proof.result;
  }

  function getl2Resolver() external view returns (address) {
    return l2resolver;
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

  function addressToBytes(address a) internal pure returns (bytes memory b) {
    b = new bytes(20);
    assembly {
      mstore(add(b, 32), mul(a, exp(256, 12)))
    }
  }

  function supportsInterface(
    bytes4 interfaceID
  ) public pure override returns (bool) {
    return
      interfaceID == type(IExtendedResolver).interfaceId ||
      super.supportsInterface(interfaceID);
  }
}
