// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract DummyOldResolver {
    function test() public returns (bool) {
        return true;
    }

    function name(bytes32) public returns (string memory) {
        return "test.eth";
    }
}
