// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import { SparseMerkleProof } from "./lib/SparseMerkleProof.sol";

import "hardhat/console.sol";

uint256 constant LAST_LEAF_INDEX = 41;

struct L2StateProof {
  bytes[] accountProof;
  bytes[] tokenIdProof;
  bytes[] addressProof;
  uint256 accountLeafIndex;
  uint256 tokenIdLeafIndex;
  uint256 addressLeafIndex;
  bytes accountValue;
  bytes32 tokenIdValue;
  bytes32 addressValue;
  uint256 l2blockNumber;
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

interface IRollup {
  function stateRootHashes(
    uint256 l2blockNumber
  ) external view returns (bytes32);
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

    // This is the hash name of the domain name
    bytes32 node = abi.decode(extraData[4:], (bytes32));

    L2StateProof memory proof = abi.decode(response, (L2StateProof));

    bytes32 stateRoot = IRollup(rollup).stateRootHashes(proof.l2blockNumber);
    // step 1: check that the right state root was used to calculate the proof
    require(
      stateRoot != bytes32(0),
      "LineaResolverStub: invalid state root"
    );

    console.logBytes32(stateRoot);

    // step 2: verify the account proof
    // the index slot 251 is for 'mapping(bytes32 => uint256) public addresses' in the L2 resolver
    // the index slot 103 is for 'mapping(uint256 => address) private _owners' in the L2 resolver

    bool accountProofVerified = SparseMerkleProof.verifyProof(
      proof.accountProof,
      proof.accountLeafIndex,
      stateRoot
    );

    require(accountProofVerified, "LineaResolverStub: invalid account proof");

    // Verify the account value
    bytes32 hAccountValue = SparseMerkleProof.hashAccountValue(
      proof.accountValue
    );

    SparseMerkleProof.Leaf memory accountLeaf = SparseMerkleProof.getLeaf(
      proof.accountProof[41]
    );

    require(
      accountLeaf.hValue == hAccountValue,
      "LineaResolverStub: account value invalid"
    );

    // Get the account to verify the storage values
    SparseMerkleProof.Account memory account = SparseMerkleProof.getAccount(
      proof.accountValue
    );

    // Verify the tokenId key and value
    verifyKeyValue(
      account,
      proof.tokenIdLeafIndex,
      proof.tokenIdProof,
      proof.tokenIdValue,
      abi.encodePacked(node)
    );

    // Verify the address key and value
    verifyKeyValue(
      account,
      proof.addressLeafIndex,
      proof.addressProof,
      proof.addressValue,
      abi.encodePacked(proof.tokenIdValue)
    );

    return abi.encode(proof.addressValue);
  }

  function verifyKeyValue(
    SparseMerkleProof.Account memory account,
    uint256 leafIndex,
    bytes[] memory proof,
    bytes32 value,
    bytes memory key
  ) private pure {
    bool storageProofVerified = SparseMerkleProof.verifyProof(
      proof,
      leafIndex,
      account.storageRoot
    );

    require(storageProofVerified, "LineaResolverStub: invalid storage proof");

    SparseMerkleProof.Leaf memory storageLeaf = SparseMerkleProof.getLeaf(
      proof[LAST_LEAF_INDEX]
    );

    // Verify the key
    bytes32 hKey = SparseMerkleProof.mimcHash(key);
    require(storageLeaf.hKey == hKey, "LineaResolverStub: key invalid");

    // Verify the storage value
    bytes32 hValue = SparseMerkleProof.hashStorageValue(value);
    require(storageLeaf.hValue == hValue, "LineaResolverStub: value invalid");
  }

  function supportsInterface(
    bytes4 interfaceID
  ) public pure override returns (bool) {
    return
      interfaceID == type(IExtendedResolver).interfaceId ||
      super.supportsInterface(interfaceID);
  }
}
