// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

/**
@title FakeRollup
@dev A mock version of the Linea Rollup contract for the unit tests
@author ConsenSys
*/
contract FakeRollup {
  // root hash of the current rollup state
  bytes32 public stateRootHash =
    0x06263c3a0a8795755e30ec09dea189b3bb8e6e93c0037c9cce5c14ac24b992ec;
}
