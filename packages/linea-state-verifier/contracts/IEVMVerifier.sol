//SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IEVMVerifier {
    function gatewayURLs() external view returns (string[] memory);

    function getStorageValues(
        address target,
        bytes32[] memory commands,
        bytes[] memory constants,
        bytes memory proof,
        uint256 acceptedL2BlockRangeLength
    ) external view returns (bytes[] memory values);
}
