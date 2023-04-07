// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract LineaResolver is Ownable {
  mapping(bytes32 => address) addresses;

  event AddrChanged(bytes32 indexed node, address a);

  function setAddr(bytes32 node, address _addr) public {
    addresses[node] = _addr;
    emit AddrChanged(node, _addr);
  }

  function addr(bytes32 node) public view returns (address) {
    return addresses[node];
  }
}
