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
    0x834eba60b0c12e36268806a52a5bbd413a6b257ed3c21acc24be5de25896532e;
}
