// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@ensdomains/ens-contracts/contracts/utils/NameEncoder.sol";

contract LineaResolver is
  ERC721Enumerable,
  ERC721URIStorage,
  AccessControlEnumerable
{
  mapping(bytes32 => uint256) public addresses;
  mapping(uint256 => string) public names;
  uint256 public tokenIds;

  event AddrChanged(bytes32 indexed node, address a);

  constructor(
    string memory _name,
    string memory _symbol
  ) ERC721(_name, _symbol) {
    // Start tokenId at index 1
    tokenIds = 1;
  }

  function mintSubdomain(
    string memory name,
    address _addr
  ) external returns (uint256) {
    (, bytes32 node) = NameEncoder.dnsEncodeName(name);

    require(addresses[node] == 0, "Sub-domain has already been registered");

    addresses[node] = tokenIds;
    names[tokenIds] = name;

    emit AddrChanged(node, _addr);
    _mint(_addr, tokenIds); // mint the new token with the current tokenId
    tokenIds++; // increment tokenId

    return tokenIds;
  }

  function resolve(bytes32 node) external view returns (address) {
    uint256 _tokenId = addresses[node];
    if (_tokenId == 0) {
      return address(0);
    }
    return ownerOf(_tokenId);
  }

  function exists(uint256 _tokenId) external view returns (bool) {
    return _exists(_tokenId);
  }

  /**
   * @dev See {IERC165-supportsInterface}.
   * @param interfaceId the interfaceId you want to know if that contracts supports (in bytes4 format)
   * @return bool true/false statement if the Turn smart-contract supports a given interface
   * (e.g. IERC721Enumerable, IAccessControlEnumerable or any of their respective parent classes)
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    override(AccessControlEnumerable, ERC721Enumerable, ERC721)
    returns (bool)
  {
    return
      AccessControlEnumerable.supportsInterface(interfaceId) ||
      ERC721Enumerable.supportsInterface(interfaceId);
  }

  /**
   * @dev Hook that is called before any token transfer. This includes minting
   * and burning.
   *
   * Calling conditions:
   *
   * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
   * transferred to `to`.
   * - When `from` is zero, `tokenId` will be minted for `to`.
   * - When `to` is zero, ``from``'s `tokenId` will be burned.
   * - `from` cannot be the zero address.
   * - `to` cannot be the zero address.
   *
   * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId,
    uint256 batchSize
  ) internal override(ERC721Enumerable, ERC721) {
    ERC721Enumerable._beforeTokenTransfer(from, to, tokenId, batchSize);
  }

  /**
   * @dev See {IERC721Metadata-tokenURI}.
   */
  function tokenURI(
    uint256 tokenId
  )
    public
    view
    virtual
    override(ERC721URIStorage, ERC721)
    returns (string memory)
  {
    return ERC721URIStorage.tokenURI(tokenId);
  }

  /**
   * @dev See {IERC721Metadata-tokenURI}.
   */
  function tokenName(
    uint256 tokenId
  ) public view virtual returns (string memory) {
    return names[tokenId];
  }

  /**
   * @notice burns a token.
   * @dev Destroys `tokenId`.
   * The approval is cleared when the token is burned.
   *
   * Requirements:
   *
   * - `tokenId` must exist.
   *
   * Emits a {Transfer} event.
   */
  function _burn(
    uint256 tokenId
  ) internal virtual override(ERC721URIStorage, ERC721) {
    address owner = ERC721.ownerOf(tokenId);

    delete names[tokenId];
    ERC721URIStorage._burn(tokenId);

    emit Transfer(owner, address(0), tokenId);
  }

  /**
   * @notice Burn function. Only works for expired tokens.
   */
  function burn(uint256 tokenId) external {
    require(
      _isApprovedOrOwner(_msgSender(), tokenId),
      "Caller is not owner or approved"
    );
    // require(block.timestamp > workPeriodEnd(retrieveDates(tokenId)), "Cannot burn non-expired tokens");

    _burn(tokenId);
  }
}
