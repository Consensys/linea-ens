// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract LineaResolver is Ownable, ERC721 {
    mapping(bytes32 => address) public addresses;
    uint256 public tokenId; 

    event AddrChanged(bytes32 indexed node, address a);

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {}

    function mintSubdomain(bytes32 node, address _addr) public onlyOwner {
        addresses[node] = _addr;
        emit AddrChanged(node, _addr);
        _mint(_addr, tokenId); // mint the new token with the current tokenId
        tokenId++; // increment tokenId
    }

    function addr(bytes32 node) public view returns (address) {
        return addresses[node];
    }
}
