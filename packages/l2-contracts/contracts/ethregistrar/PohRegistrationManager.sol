//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title PohRegistrationManager
 * @dev Contract to manage the registration status of addresses using Proof of Humanity (PoH).
 */
contract PohRegistrationManager is Ownable2Step {
    mapping(address => bool) public hasRegisteredPoh;
    mapping(address => bool) public managers;

    modifier onlyManager() {
        require(managers[msg.sender]);
        _;
    }

    /**
     * @dev Marks an address as having successfully registered using PoH.
     * @param _address The address to mark as registered.
     */
    function markAsRegistered(address _address) external onlyManager {
        hasRegisteredPoh[_address] = true;
    }

    /**
     * @dev Checks if an address has successfully registered using PoH.
     * @param _address The address to check.
     * @return bool True if the address has registered, false otherwise.
     */
    function isRegistered(address _address) public view returns (bool) {
        return hasRegisteredPoh[_address];
    }

    /**
     * @dev Sets or revokes the manager role for an address.
     * Allows the contract owner to designate certain addresses as managers,
     * who are then authorized to mark addresses as having successfully registered using PoH.
     * This function can also be used to revoke the manager role by setting `isManager` to false.
     *
     * @param _manager The address to be set as a manager or to have its manager role revoked.
     * @param isManager A boolean indicating whether the address should be set as a manager (true)
     * or have its manager role revoked (false).
     */
    function setManager(address _manager, bool isManager) external onlyOwner {
        managers[_manager] = isManager;
    }
}
