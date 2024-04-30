//SPDX-License-Identifier: MIT
pragma solidity ~0.8.17;

import {BaseRegistrarImplementation} from "./BaseRegistrarImplementation.sol";
import {StringUtils} from "./StringUtils.sol";
import {Resolver} from "../resolvers/Resolver.sol";
import {ENS} from "../registry/ENS.sol";
import {ReverseRegistrar} from "../reverseRegistrar/ReverseRegistrar.sol";
import {ReverseClaimer} from "../reverseRegistrar/ReverseClaimer.sol";
import {IETHRegistrarController, IPriceOracle} from "./IETHRegistrarController.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {INameWrapper} from "../wrapper/INameWrapper.sol";
import {ERC20Recoverable} from "../utils/ERC20Recoverable.sol";
import {NameEncoder} from "../utils/NameEncoder.sol";

import {PohVerifier} from "./PohVerifier.sol";
import {PohRegistrationManager} from "./PohRegistrationManager.sol";

error CommitmentTooNew(bytes32 commitment);
error CommitmentTooOld(bytes32 commitment);
error NameNotAvailable(string name);
error DurationTooShort(uint256 duration);
error ResolverRequiredWhenDataSupplied();
error UnexpiredCommitmentExists(bytes32 commitment);
error InsufficientValue();
error Unauthorised(bytes32 node);
error MaxCommitmentAgeTooLow();
error MaxCommitmentAgeTooHigh();
error PohVerificationFailed(address owner);
error OwnerAlreadyRegistered(address owner);
error SenderNotOwner(address owner, address sender);
error WrongPohRegistrationDuration(uint256 duration);

/**
 * @dev A registrar controller for registering and renewing names at fixed cost.
 */
contract ETHRegistrarController is
    Ownable,
    IETHRegistrarController,
    IERC165,
    ERC20Recoverable,
    ReverseClaimer
{
    using StringUtils for *;
    using Address for address;

    uint256 public constant MIN_REGISTRATION_DURATION = 28 days;
    /// @dev Registration through POH is fixed to a 3 years duration
    uint256 public constant POH_REGISTRATION_DURATION = 1 days * 365 * 3;
    uint64 private constant MAX_EXPIRY = type(uint64).max;
    BaseRegistrarImplementation immutable base;
    IPriceOracle public immutable prices;
    uint256 public immutable minCommitmentAge;
    uint256 public immutable maxCommitmentAge;
    ReverseRegistrar public immutable reverseRegistrar;
    INameWrapper public immutable nameWrapper;
    /// @dev PohVerifier contract that is used to verify the POH signature
    PohVerifier public immutable pohVerifier;
    /// @dev PohRegistrationManager contract to keep track of the addresses that used their POH registration (One by address)
    PohRegistrationManager public immutable pohRegistrationManager;
    /// @dev node of the base domain configured (eg: namehash(linea.eth))
    bytes32 public immutable baseNode;

    mapping(bytes32 => uint256) public commitments;
    /// @dev string of the base domain configured (eg: 'linea.eth')
    string public baseDomain;

    event NameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 baseCost,
        uint256 premium,
        uint256 expires
    );

    event PohNameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 expires
    );
    event NameRenewed(
        string name,
        bytes32 indexed label,
        uint256 cost,
        uint256 expires
    );

    event OwnerNameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 expires
    );

    /**
     * @notice Create registrar for the base domain passed in parameter.
     * @param _base Base registrar address.
     * @param _prices Price oracle address.
     * @param _minCommitmentAge Minimum commitment age.
     * @param _maxCommitmentAge Maximum commitment age.
     * @param _reverseRegistrar Reverse registrar address.
     * @param _nameWrapper Name wrapper address.
     * @param _ens ENS registry address.
     * @param _pohVerifier POH Verifier address.
     * @param _pohRegistrationManager POH registration manager address.
     * @param _baseNode Base node hash.
     * @param _baseDomain Base domain string.
     */
    constructor(
        BaseRegistrarImplementation _base,
        IPriceOracle _prices,
        uint256 _minCommitmentAge,
        uint256 _maxCommitmentAge,
        ReverseRegistrar _reverseRegistrar,
        INameWrapper _nameWrapper,
        ENS _ens,
        PohVerifier _pohVerifier,
        PohRegistrationManager _pohRegistrationManager,
        bytes32 _baseNode,
        string memory _baseDomain
    ) ReverseClaimer(_ens, msg.sender) {
        if (_maxCommitmentAge <= _minCommitmentAge) {
            revert MaxCommitmentAgeTooLow();
        }

        if (_maxCommitmentAge > block.timestamp) {
            revert MaxCommitmentAgeTooHigh();
        }

        base = _base;
        prices = _prices;
        minCommitmentAge = _minCommitmentAge;
        maxCommitmentAge = _maxCommitmentAge;
        reverseRegistrar = _reverseRegistrar;
        nameWrapper = _nameWrapper;
        pohVerifier = _pohVerifier;
        pohRegistrationManager = _pohRegistrationManager;
        baseNode = _baseNode;
        baseDomain = _baseDomain;
    }

    function rentPrice(
        string memory name,
        uint256 duration
    ) public view override returns (IPriceOracle.Price memory price) {
        bytes32 label = keccak256(bytes(name));
        price = prices.price(name, base.nameExpires(uint256(label)), duration);
    }

    function valid(string memory name) public pure returns (bool) {
        return name.strlen() >= 3;
    }

    function available(string memory name) public view override returns (bool) {
        bytes32 label = keccak256(bytes(name));
        return valid(name) && base.available(uint256(label));
    }

    function makeCommitment(
        string memory name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses
    ) public pure override returns (bytes32) {
        bytes32 label = keccak256(bytes(name));
        if (data.length > 0 && resolver == address(0)) {
            revert ResolverRequiredWhenDataSupplied();
        }
        return
            keccak256(
                abi.encode(
                    label,
                    owner,
                    duration,
                    secret,
                    resolver,
                    data,
                    reverseRecord,
                    ownerControlledFuses
                )
            );
    }

    function commit(bytes32 commitment) public override {
        if (commitments[commitment] + maxCommitmentAge >= block.timestamp) {
            revert UnexpiredCommitmentExists(commitment);
        }
        commitments[commitment] = block.timestamp;
    }

    /**
     * @notice Register a new domain using POH for free, one address that has POH can register only one domain
     * @param name to register
     * @param owner of the name
     * @param duration length of the registration
     * @param secret hash of the commitment made before the registration
     * @param resolver address to set for this domain(Default is public resolver address)
     * @param data the operations to apply to this domain after the registration (eg: setRecords)
     * @param reverseRecord boolean to activate the reverse record for this domain
     * @param ownerControlledFuses fuses
     * @param signature the POH signature crafted by the POH API to verify that the owner address has POH
     */
    function registerPoh(
        string calldata name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bytes memory signature
    ) public {
        // The sender of the transaction needs to be the owner
        if (msg.sender != owner) {
            revert SenderNotOwner(owner, msg.sender);
        }

        // POH registration has to be valid for a duration of 3 years
        if (duration != POH_REGISTRATION_DURATION) {
            revert WrongPohRegistrationDuration(duration);
        }

        // An andress can own only one domain using its PoH
        if (redeemed(owner)) {
            revert OwnerAlreadyRegistered(owner);
        }

        // Check that the signature sent is valid, this is the reference for an address to have a valid PoH
        if (!pohVerifier.verify(signature, owner)) {
            revert PohVerificationFailed(owner);
        }

        // Mark this address as having successfully registered and used its POH right
        pohRegistrationManager.markAsRegistered(owner);

        uint256 expires = _register(
            name,
            owner,
            duration,
            secret,
            resolver,
            data,
            reverseRecord,
            ownerControlledFuses,
            false
        );

        emit PohNameRegistered(name, keccak256(bytes(name)), owner, expires);
    }

    /**
     * @notice Check if an address has already used its POH or not
     * @param _address to check
     */
    function redeemed(address _address) public view returns (bool) {
        return pohRegistrationManager.isRegistered(_address);
    }

    /**
     * @notice Register a new domain using ENS standard registration
     * @dev Most of the logic has been moved to the internal _register() to be used by registerPOH as well
     * @dev Only the price check and event are kept
     * @param name to register
     * @param owner of the name
     * @param duration length of the registration
     * @param secret hash of the commitment made before the registration
     * @param resolver address to set for this domain(Default is public resolver address)
     * @param data the operations to apply to this domain after the registration (eg: setRecords)
     * @param reverseRecord boolean to activate the reverse record for this domain
     * @param ownerControlledFuses fuses
     */
    function register(
        string calldata name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses
    ) public payable override {
        IPriceOracle.Price memory price = rentPrice(name, duration);
        if (msg.value < price.base + price.premium) {
            revert InsufficientValue();
        }
        uint256 expires = _register(
            name,
            owner,
            duration,
            secret,
            resolver,
            data,
            reverseRecord,
            ownerControlledFuses,
            false
        );

        emit NameRegistered(
            name,
            keccak256(bytes(name)),
            owner,
            price.base,
            price.premium,
            expires
        );

        if (msg.value > (price.base + price.premium)) {
            payable(msg.sender).transfer(
                msg.value - (price.base + price.premium)
            );
        }
    }

    /**
     * @notice Internal register method called by register() and registerPOH
     * @dev An additional param has been added to bypass the commitment if needed
     * @dev Contains the registration logic
     * @param name to register
     * @param owner of the name
     * @param duration length of the registration
     * @param secret hash of the commitment made before the registration
     * @param resolver address to set for this domain(Default is public resolver address)
     * @param data the operations to apply to this domain after the registration (eg: setRecords)
     * @param reverseRecord boolean to activate the reverse record for this domain
     * @param ownerControlledFuses fuses
     * @param bypassCommitment boolean to bypass the commitment
     */
    function _register(
        string calldata name,
        address owner,
        uint256 duration,
        bytes32 secret,
        address resolver,
        bytes[] calldata data,
        bool reverseRecord,
        uint16 ownerControlledFuses,
        bool bypassCommitment
    ) internal returns (uint256) {
        // Skip the commitment process if bypassCommitment is true
        if (!bypassCommitment) {
            _consumeCommitment(
                name,
                duration,
                makeCommitment(
                    name,
                    owner,
                    duration,
                    secret,
                    resolver,
                    data,
                    reverseRecord,
                    ownerControlledFuses
                )
            );
        }

        uint256 expires = nameWrapper.registerAndWrap(
            name,
            owner,
            duration,
            resolver,
            ownerControlledFuses
        );

        if (data.length > 0) {
            _setRecords(resolver, keccak256(bytes(name)), data);
        }

        if (reverseRecord) {
            _setReverseRecord(name, resolver, msg.sender);
        }

        return expires;
    }

    function renew(
        string calldata name,
        uint256 duration
    ) external payable override {
        bytes32 labelhash = keccak256(bytes(name));
        uint256 tokenId = uint256(labelhash);
        IPriceOracle.Price memory price = rentPrice(name, duration);
        if (msg.value < price.base) {
            revert InsufficientValue();
        }
        uint256 expires = nameWrapper.renew(tokenId, duration);

        if (msg.value > price.base) {
            payable(msg.sender).transfer(msg.value - price.base);
        }

        emit NameRenewed(name, labelhash, msg.value, expires);
    }

    function withdraw() public {
        payable(owner()).transfer(address(this).balance);
    }

    function supportsInterface(
        bytes4 interfaceID
    ) external pure returns (bool) {
        return
            interfaceID == type(IERC165).interfaceId ||
            interfaceID == type(IETHRegistrarController).interfaceId;
    }

    /* Internal functions */

    function _consumeCommitment(
        string memory name,
        uint256 duration,
        bytes32 commitment
    ) internal {
        // Require an old enough commitment.
        if (commitments[commitment] + minCommitmentAge > block.timestamp) {
            revert CommitmentTooNew(commitment);
        }

        // If the commitment is too old, or the name is registered, stop
        if (commitments[commitment] + maxCommitmentAge <= block.timestamp) {
            revert CommitmentTooOld(commitment);
        }
        if (!available(name)) {
            revert NameNotAvailable(name);
        }

        delete (commitments[commitment]);

        if (duration < MIN_REGISTRATION_DURATION) {
            revert DurationTooShort(duration);
        }
    }

    /**
     * @notice Set the records linked to a domain for an owner
     * @dev Same as original ENS's _setRecords except that it uses the baseNode instead of hardcoded ETH_NODE
     * @param resolverAddress resolver's address
     * @param label hash of the domain's label to register
     * @param data list of records to save
     */
    function _setRecords(
        address resolverAddress,
        bytes32 label,
        bytes[] calldata data
    ) internal {
        bytes32 nodehash = keccak256(abi.encodePacked(baseNode, label));
        Resolver resolver = Resolver(resolverAddress);
        resolver.multicallWithNodeCheck(nodehash, data);
    }

    /**
     * @notice Set the reverse record for the name passed in parameter
     * @dev Same as original ENS's _setReverseRecord except that it uses the baseNode instead of hardcoded ETH_NODE
     * @param name string to setup the reverse record for
     * @param resolver resolver's address
     * @param owner address to set the reverse record for
     */
    function _setReverseRecord(
        string memory name,
        address resolver,
        address owner
    ) internal {
        reverseRegistrar.setNameForAddr(
            msg.sender,
            owner,
            resolver,
            string.concat(name, baseDomain)
        );
    }

    /**
     * @dev Allows a specified owner to register a name directly, with an option to bypass the commitment process.
     * @param name The domain name to be registered.
     * @param owner The address that will own the registered domain.
     * @param duration How long the registration is valid.
     * @param resolver The address of the resolver contract for this domain.
     * @param data An array of bytes, possibly representing records to be set for the domain.
     * @param ownerControlledFuses A parameter likely related to permissions or security settings for the domain.
     * @param reverseRecord A boolean indicating whether a reverse record should be set.
     */
    function ownerRegister(
        string calldata name,
        address owner,
        uint256 duration,
        address resolver,
        bytes[] calldata data,
        uint16 ownerControlledFuses,
        bool reverseRecord
    ) external onlyOwner {
        uint256 expires = _register(
            name,
            owner,
            duration,
            bytes32(0),
            resolver,
            data,
            reverseRecord,
            ownerControlledFuses,
            true
        );

        emit OwnerNameRegistered(name, keccak256(bytes(name)), owner, expires);
    }
}
