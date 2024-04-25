//SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IEVMVerifier {
    function gatewayURLs() external view returns (string[] memory);

    function getStorageValues(
        bytes32[] memory commands,
        bytes[] memory constants,
        bytes memory proof
    ) external view returns (bytes[] memory values);
}
