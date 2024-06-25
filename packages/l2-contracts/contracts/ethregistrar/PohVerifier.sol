// SPDX-License-Identifier: UNLICENSED
pragma solidity ~0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Contract to check the signature crafted by the POH API.
 * @author ConsenSys Software Inc.
 */
contract PohVerifier is EIP712, Ownable {
    string private constant SIGNING_DOMAIN = "VerifyPoh";
    string private constant SIGNATURE_VERSION = "1";

    /// @dev POH Signature's signer address
    address public signer;

    event SignerUpdated(address indexed newSigner);

    /**
     * @notice Contract created with the sender as owner and signer
     */
    constructor() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) Ownable() {
        signer = msg.sender;
    }

    /**
     * @notice Set a new signer
     * @dev Signer's address has to be the same address as the POH API signer
     * @param _signer The new signer's address
     */
    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid address");
        signer = _signer;
        emit SignerUpdated(_signer);
    }

    /**
     * @notice Verify the signature sent in parameter
     * @dev human is supposed to be a POH address, this is what is being signed by the POH API
     * @param signature The signature to verify
     * @param human the address for which the signature has been crafted
     */
    function verify(
        bytes memory signature,
        address human
    ) external view virtual returns (bool) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(keccak256("POH(address to)"), human))
        );

        address recoveredSigner = ECDSA.recover(digest, signature);
        return recoveredSigner == signer;
    }

    /**
     * @notice Returns the signer's address
     */
    function getSigner() external view returns (address) {
        return signer;
    }
}
