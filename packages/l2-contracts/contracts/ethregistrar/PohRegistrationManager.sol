//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

/**
 * @title PohRegistrationManager
 * @dev Contract to manage the registration status of addresses using Proof of Humanity (PoH).
 */
contract PohRegistrationManager {
    mapping(address => bool) public hasRegisteredPoh;

    /**
     * @dev Marks an address as having successfully registered using PoH.
     * @param _address The address to mark as registered.
     */
    function markAsRegistered(address _address) external {
        hasRegisteredPoh[_address] = true;
    }

    /**
     * @dev Checks if an address has successfully registered using PoH.
     * @param _address The address to check.
     * @return bool True if the address has registered, false otherwise.
     */
    function isRegistered(address _address) external view returns (bool) {
        return hasRegisteredPoh[_address];
    }
}