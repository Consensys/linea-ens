// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import { Lib_OVMCodec } from "@eth-optimism/contracts/libraries/codec/Lib_OVMCodec.sol";
import { Lib_SecureMerkleTrie } from "@eth-optimism/contracts/libraries/trie/Lib_SecureMerkleTrie.sol";
import { Lib_RLPReader } from "@eth-optimism/contracts/libraries/rlp/Lib_RLPReader.sol";
import { Lib_BytesUtils } from "@eth-optimism/contracts/libraries/utils/Lib_BytesUtils.sol";

import { console } from "hardhat/console.sol";

interface IResolverService {
  function resolve(
    bytes calldata name,
    bytes calldata data
  ) external view returns (address addr);
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

interface IRollup {
  function stateRootHash() external view returns (bytes32);
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
  address public rollup;

  error OffchainLookup(
    address sender,
    string[] urls,
    bytes callData,
    bytes4 callbackFunction,
    bytes extraData
  );

  /**
   * @dev The Linea Resolver on L1 will use the gateway passed as parameter to resolve
   * the node, it needs to the resolver address on L2 to verify the returned result
   * as well as the linea rollup address
   * @param _gateways the urls to call to get the address from the resolver on L2
   * @param _l2resolver the address of the resolver on L2
   * @param _rollup the address of the linea rollup contract
   */
  constructor(string[] memory _gateways, address _l2resolver, address _rollup) {
    gateways = _gateways;
    l2resolver = _l2resolver;
    rollup = _rollup;
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
      return "";
    }

    address addr = abi.decode(response, (address));
    console.log(addr);

    return abi.encode(addr);
  }

  function getStorageValue(
    address target,
    bytes32 slot,
    bytes32 stateRoot,
    bytes memory stateTrieWitness,
    bytes memory storageTrieWitness
  ) internal pure returns (bool exists, bytes32) {
    (
      bool accountExists,
      bytes memory encodedResolverAccount
    ) = Lib_SecureMerkleTrie.get(
        abi.encodePacked(target),
        stateTrieWitness,
        stateRoot
      );
    require(accountExists, "LineaResolverStub: Account does not exist");
    Lib_OVMCodec.EVMAccount memory account = Lib_OVMCodec.decodeEVMAccount(
      encodedResolverAccount
    );
    (bool storageExists, bytes memory retrievedValue) = Lib_SecureMerkleTrie
      .get(abi.encodePacked(slot), storageTrieWitness, account.storageRoot);
    if (storageExists) {
      return (true, toBytes32PadLeft(Lib_RLPReader.readBytes(retrievedValue)));
    }
    return (false, bytes32(0));
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
