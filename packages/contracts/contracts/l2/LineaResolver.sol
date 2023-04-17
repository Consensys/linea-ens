// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@ensdomains/ens-contracts/contracts/utils/NameEncoder.sol";

/**
@title LineaResolver
@dev A Solidity contract that implements an ERC721 token for resolving Ethereum domain names to addresses.
@author ConsenSys
*/
contract LineaResolver is ERC721, Ownable {
  // Mapping to store Ethereum domain names (as bytes32) and their corresponding addresses (as uint256)
  mapping(bytes32 => uint256) public addresses;
  // Mapping to store token IDs (as uint256) and their corresponding domain name (as string)
  mapping(uint256 => string) public tokenDomains;
  // Counter to keep track of token IDs for minting new tokens
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  // Private string variable to store the base URI for the token URI generation
  string private _baseTokenURI;

  /**
   * @dev Emitted when the address associated with a specific node is changed.
   * @param node The bytes32 value representing the node whose address is being changed.
   * @param a The new address that is being associated with the node.
   */
  event AddrChanged(bytes32 indexed node, address a);

  /**
   * @dev Constructor function to initialize the ERC721 contract with the given name, symbol, and base URI.
   * @notice This constructor function is used to initialize the ERC721 contract with the given name, symbol, and base URI.
   * @param _name The name of the ERC721 token.
   * @param _symbol The symbol of the ERC721 token.
   * @param baseURI The base URI for the token URI.
   */
  constructor(
    string memory _name,
    string memory _symbol,
    string memory baseURI
  ) ERC721(_name, _symbol) {
    _baseTokenURI = baseURI;
    _tokenIds.increment();
  }

  /**
   * @dev Mints a new subdomain token for the given name and address.
   * @notice This function is used to mint a new subdomain token for the given name and address.
   * @param name The name of the subdomain to mint.
   * @param _addr The address associated with the subdomain.
   */
  function mintSubdomain(string memory name, address _addr) external {
    (, bytes32 node) = NameEncoder.dnsEncodeName(name);

    string memory domain = _toLower(name);
    uint256 newItemId = _tokenIds.current();

    require(addresses[node] == 0, "Sub-domain has already been registered");
    require(bytes(domain).length != 0, "Sub-domain cannot be null");

    addresses[node] = newItemId;
    tokenDomains[newItemId] = domain;

    emit AddrChanged(node, _addr);
    _mint(_addr, newItemId); // mint the new token with the current _tokenIds

    _tokenIds.increment(); // increment tokenIds
  }

  /**
   * @dev Resolves an Ethereum domain.
   * @notice This function is used to resolve an Ethereum domain.
   * @param node The ENS node to resolve.
   * @return The address associated with the resolved ENS node, or address(0) if not found.
   */
  function resolve(bytes32 node) external view returns (address) {
    uint256 _tokenId = addresses[node];
    if (!_exists(_tokenId)) {
      return address(0);
    }
    return ownerOf(_tokenId);
  }

  function exists(uint256 _tokenId) external view returns (bool) {
    return _exists(_tokenId);
  }

  /**
   * @dev Sets the base token URI.
   * @notice This function is used to set the base URI for token metadata of an ERC721 contract.
   * @param baseURI The new base URI for token metadata.
   * @return The updated base token URI.
   */
  function setBaseTokenURI(
    string memory baseURI
  ) external onlyOwner returns (string memory) {
    require(bytes(baseURI).length != 0, "Base URI cannot be empty");
    _baseTokenURI = baseURI;
    return _baseTokenURI;
  }

  /**
   * @dev Retrieves the token URI for a specific ERC721 token.
   * @notice This function retrieves the token URI associated with the specified ERC721 token ID.
   * @param tokenId The ID of the ERC721 token to retrieve the token URI for.
   * @return The token URI associated with the specified ERC721 token ID.
   */
  function tokenURI(
    uint256 tokenId
  ) public view virtual override returns (string memory) {
    _requireMinted(tokenId);

    string memory _tokenURI = Strings.toString(tokenId);
    string memory base = _baseTokenURI;

    // If there is no base URI, return the token URI.
    if (bytes(base).length == 0) {
      return _tokenURI;
    }
    // Concatenate the baseURI and tokenURI (via abi.encodePacked).
    return string(abi.encodePacked(base, _tokenURI));
  }

  /**
   * @dev Retrieves the name associated with a specific ERC721 token.
   * @notice This function retrieves the name associated with the specified ERC721 token ID.
   * @param tokenId The ID of the ERC721 token to retrieve the name for.
   * @return The name associated with the specified ERC721 token ID.
   */
  function tokenName(
    uint256 tokenId
  ) public view virtual returns (string memory) {
    return tokenDomains[tokenId];
  }

  /**
   * @dev Burns a specific ERC721 token.
   * @notice This function is used to burn a specific ERC721 token by its token ID.
   * @param tokenId The ID of the ERC721 token to be burned.
   */
  function burn(uint256 tokenId) external {
    require(
      _isApprovedOrOwner(_msgSender(), tokenId),
      "Caller is not owner or approved"
    );
    _burn(tokenId);
    delete tokenDomains[tokenId];
  }

  /**
   * @dev Converts a string to lowercase.
   * @notice This function takes an input string and converts it to lowercase.
   * @param str The input string to be converted to lowercase.
   * @return The lowercase version of the input string.
   */
  function _toLower(string memory str) internal pure returns (string memory) {
    bytes memory bStr = bytes(str);
    bytes memory bLower = new bytes(bStr.length);
    for (uint i = 0; i < bStr.length; i++) {
      // Uppercase character...
      if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
        // So we add 32 to make it lowercase
        bLower[i] = bytes1(uint8(bStr[i]) + 32);
      } else {
        bLower[i] = bStr[i];
      }
    }
    return string(bLower);
  }
}
