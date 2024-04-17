// SPDX-License-Identifier: UNLICENSED
pragma solidity ~0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PohVerifier is EIP712, Ownable {
    string private constant SIGNING_DOMAIN = "VerifyPoh";
    string private constant SIGNATURE_VERSION = "1";

    address payable public signer;

    event Withdrawal(uint amount, uint when);
    event SignerUpdated(address indexed newSigner);

    constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) Ownable() {
        signer = payable(msg.sender);
    }

    function setSigner(address _signer) public onlyOwner {
        require(_signer != address(0), "Invalid address");
        signer = payable(_signer);
        emit SignerUpdated(_signer);
    }

    function verify(
        bytes memory signature,
        address human
    ) public view virtual returns (bool) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(keccak256("POH(address to)"), human))
        );

        address recoveredSigner = ECDSA.recover(digest, signature);
        return recoveredSigner == signer;
    }
}
