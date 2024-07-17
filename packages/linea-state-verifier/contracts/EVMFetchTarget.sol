//SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {IEVMVerifier} from "./IEVMVerifier.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/**
 * @dev Callback implementation for users of `EVMFetcher`. If you use `EVMFetcher`, your contract must
 *      inherit from this contract in order to handle callbacks correctly.
 */
abstract contract EVMFetchTarget {
    using Address for address;

    error ResponseLengthMismatch(uint256 actual, uint256 expected);

    /**
     * @dev Internal callback function invoked by CCIP-Read in response to a `getStorageSlots` request.
     * @dev Only the first 32 bytes are used for callbackData and is never longer than 32 bytes
     */
    function getStorageSlotsCallback(
        bytes calldata response,
        bytes calldata extradata
    ) external returns (bytes memory) {
        bytes memory proof = abi.decode(response, (bytes));
        (
            IEVMVerifier verifier,
            address addr,
            bytes32[] memory commands,
            bytes[] memory constants,
            bytes4 callback,
            bytes memory callbackData
        ) = abi.decode(
                extradata,
                (IEVMVerifier, address, bytes32[], bytes[], bytes4, bytes)
            );

        uint256 acceptedL2BlockRangeLength = uint256(bytes32(callbackData));
        bytes[] memory values = verifier.getStorageValues(
            addr,
            commands,
            constants,
            proof,
            acceptedL2BlockRangeLength
        );
        if (values.length != commands.length) {
            revert ResponseLengthMismatch(values.length, commands.length);
        }
        bytes memory ret = address(this).functionCall(
            abi.encodeWithSelector(callback, values, "")
        );
        assembly {
            return(add(ret, 32), mload(ret))
        }
    }
}
