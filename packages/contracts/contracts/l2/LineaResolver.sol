// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LineaResolver is ERC721 {
  mapping(bytes32 => uint256) public addresses;
  uint256 public tokenId;

  event AddrChanged(bytes32 indexed node, address a);

  constructor(
    string memory _name,
    string memory _symbol
  ) ERC721(_name, _symbol) {
    // Start tokenId at index 1
    tokenId = 1;
  }

  function mintSubdomain(
    bytes32 node,
    address _addr
  ) external returns (uint256) {
    require(addresses[node] == 0, "Sub-domain has already been registered");

    addresses[node] = tokenId;
    emit AddrChanged(node, _addr);
    _mint(_addr, tokenId); // mint the new token with the current tokenId
    tokenId++; // increment tokenId

    return tokenId;
  }

  function resolve(bytes32 node) external view returns (address) {
    uint256 _tokenId = addresses[node];
    return ownerOf(_tokenId);
  }
}
