//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PohRegistrationManager
 * @dev Contract to manage the registration status of addresses using Proof of Humanity (PoH).
 */
contract PohRegistrationManager is Ownable {
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


    function setManager(
        address _manager,
        bool isManager
    ) external onlyOwner {
        managers[_manager] = isManager;
    }
}
