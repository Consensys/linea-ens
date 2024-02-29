// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lock712 is EIP712, Ownable {
    string private constant SIGNING_DOMAIN = "VotingApp";
    string private constant SIGNATURE_VERSION = "1";

    uint public unlockTime;
    address payable public owner2;
    address payable public signer;

    event Withdrawal(uint amount, uint when);
    event SignerUpdated(address indexed newSigner);

    constructor(
        uint _unlockTime
    ) payable EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) Ownable(msg.sender) {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );

        unlockTime = _unlockTime;
        owner2 = payable(msg.sender);
        signer = payable(msg.sender);
        console.log("Contract Deployed 01");
    }

    function setSigner(address _signer) public onlyOwner {
        require(_signer != address(0), "Invalid address");
        signer = payable(_signer);
        emit SignerUpdated(_signer);
    }

    function verify(
        bytes memory signature,
        address signer,
        address mailTo,
        string memory mailContents
    ) public view returns (address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("Mail(address to,string contents)"),
                    mailTo,
                    keccak256(bytes(mailContents))
                )
            )
        );

        address recoveredSigner = ECDSA.recover(digest, signature);
        return recoveredSigner;
    }

    function withdraw42() public {
        // Uncomment this line, and the import of "hardhat/console.sol", to print a log in your terminal
        // console.log("Unlock time is %o and block timestamp is %o", unlockTime, block.timestamp);

        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner2, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner2.transfer(address(this).balance);
    }
}
