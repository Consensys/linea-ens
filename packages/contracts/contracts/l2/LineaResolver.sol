// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract LineaResolver is Ownable, ERC721 {
  mapping(bytes32 => uint256) public addresses;
  uint256 public tokenId;

  event AddrChanged(bytes32 indexed node, address a);

  constructor(
    string memory _name,
    string memory _symbol
  ) ERC721(_name, _symbol) {}

  function mintSubdomain(
    bytes32 node,
    address _addr
  ) external returns (uint256) {
    string memory nodeStr = bytes32ToString(node);

    require(addresses[node] == 0, "Sub-domain has already been registered");
    require(bytes(nodeStr).length != 0, "Sub-domain cannot be null");
    require(
      testAlphaNumeric(nodeStr) == true,
      "Sub-domain contains unsupported characters"
    );

    addresses[node] = tokenId;
    emit AddrChanged(node, _addr);
    _mint(_addr, tokenId); // mint the new token with the current tokenId
    tokenId++; // increment tokenId

    return tokenId;
  }

  function testAlphaNumeric(string memory str) public pure returns (bool) {
    bytes memory b = bytes(str);
    for (uint i; i < b.length; i++) {
      bytes1 char = b[i];
      if (!(char > 0x2F && char < 0x3A) && !(char > 0x60 && char < 0x7B))
        return false;
    }
    return true;
  }

  function bytes32ToString(bytes32 x) private pure returns (string memory) {
    bytes memory b = new bytes(32);
    for (uint i = 0; i < 32; i++) {
      b[i] = x[i];
    }
    return string(b);
  }

  function resolve(bytes32 node) external view returns (address) {
    uint256 tokenId = addresses[node];
    return ownerOf(tokenId);
  }
}
