const ENS = artifacts.require('./registry/ENSRegistry')
const PublicResolver = artifacts.require('./resolvers/PublicResolver')
const BaseRegistrar = artifacts.require('./BaseRegistrarImplementation')
const ETHRegistrarController = artifacts.require('./ETHRegistrarController')
const DummyOracle = artifacts.require('./DummyOracle')
const StablePriceOracle = artifacts.require('./StablePriceOracle')
const BulkRenewal = artifacts.require('./BulkRenewal')
const { deploy } = require('../test-utils/contracts')
const {
  EMPTY_BYTES32: EMPTY_BYTES,
  BASE_NODE_BYTES32,
  BASE_NODE_DNS_ENCODED,
  BASE_DOMAIN_STR,
  BASE_DOMAIN_LABEL,
} = require('../test-utils/constants')

const namehash = require('eth-ens-namehash')
const sha3 = require('web3-utils').sha3
const toBN = require('web3-utils').toBN
const { exceptions } = require('../test-utils')

const ETH_LABEL = sha3('eth')
const ETH_NAMEHASH = namehash.hash('eth')

contract('BulkRenewal', function (accounts) {
  let ens
  let resolver
  let baseRegistrar
  let controller
  let priceOracle
  let bulkRenewal
  let nameWrapper
  let reverseRegistrar

  const ownerAccount = accounts[0] // Account that owns the registrar
  const registrantAccount = accounts[1] // Account that owns test names
  const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

  before(async () => {
    // Create a registry
    ens = await ENS.new()
    // Create a base registrar
    baseRegistrar = await BaseRegistrar.new(ens.address, BASE_NODE_BYTES32, {
      from: ownerAccount,
    })

    // Setup reverseRegistrar
    reverseRegistrar = await deploy('ReverseRegistrar', ens.address)

    await ens.setSubnodeOwner(EMPTY_BYTES, sha3('reverse'), accounts[0])
    await ens.setSubnodeOwner(
      namehash.hash('reverse'),
      sha3('addr'),
      reverseRegistrar.address,
    )

    // Create a name wrapper
    nameWrapper = await deploy(
      'NameWrapper',
      ens.address,
      baseRegistrar.address,
      ownerAccount,
      BASE_NODE_BYTES32,
      BASE_NODE_DNS_ENCODED,
    )

    // Create a public resolver
    resolver = await PublicResolver.new(
      ens.address,
      nameWrapper.address,
      EMPTY_ADDRESS,
      EMPTY_ADDRESS,
    )

    // Deploy PohVerifier contract
    const PohVerifier = await ethers.getContractFactory('PohVerifier')
    const pohVerifier = await PohVerifier.deploy()
    await pohVerifier.deployed()

    // Deploy PohRegistrationManager contract
    const PohRegistrationManager = await ethers.getContractFactory(
      'PohRegistrationManager',
    )
    const pohRegistrationManager = await PohRegistrationManager.deploy()
    await pohRegistrationManager.deployed()

    // Set up a dummy price oracle and a controller
    const dummyOracle = await DummyOracle.new(toBN(100000000))
    priceOracle = await StablePriceOracle.new(
      dummyOracle.address,
      [0, 0, 4, 2, 1],
    )
    controller = await ETHRegistrarController.new(
      baseRegistrar.address,
      priceOracle.address,
      600,
      86400,
      EMPTY_ADDRESS,
      nameWrapper.address,
      ens.address,
      pohVerifier.address,
      pohRegistrationManager.address,
      BASE_NODE_BYTES32,
      '.' + BASE_DOMAIN_STR,
      { from: ownerAccount },
    )
    var wrapperAddress = await controller.nameWrapper()
    await baseRegistrar.addController(controller.address, {
      from: ownerAccount,
    })
    await baseRegistrar.addController(ownerAccount, { from: ownerAccount })
    await baseRegistrar.addController(nameWrapper.address, {
      from: ownerAccount,
    })
    await nameWrapper.setController(controller.address, true, {
      from: ownerAccount,
    })
    // Create the bulk registration contract
    bulkRenewal = await BulkRenewal.new(ens.address, BASE_NODE_BYTES32)

    // Configure a resolver for .eth and register the controller interface
    // then transfer the .eth node to the base registrar.
    await ens.setSubnodeRecord(
      '0x0',
      ETH_LABEL,
      ownerAccount,
      resolver.address,
      0,
    )

    await ens.setSubnodeRecord(
      ETH_NAMEHASH,
      BASE_DOMAIN_LABEL,
      ownerAccount,
      resolver.address,
      0,
    )
    await resolver.setInterface(
      BASE_NODE_BYTES32,
      '0xe3e336c6',
      controller.address,
    )
    await ens.setOwner(ETH_NAMEHASH, baseRegistrar.address)
    await ens.setOwner(BASE_NODE_BYTES32, baseRegistrar.address)

    // Register some names
    for (const name of ['test1', 'test2', 'test3']) {
      await baseRegistrar.register(sha3(name), registrantAccount, 31536000)
    }
  })

  it('should return the cost of a bulk renewal', async () => {
    assert.equal(
      await bulkRenewal.rentPrice(['test1', 'test2'], 86400),
      86400 * 2,
    )
  })

  it('should raise an error trying to renew a nonexistent name', async () => {
    await exceptions.expectFailure(bulkRenewal.renewAll(['foobar'], 86400))
  })

  it('should permit bulk renewal of names', async () => {
    const oldExpiry = await baseRegistrar.nameExpires(sha3('test2'))
    const tx = await bulkRenewal.renewAll(['test1', 'test2'], 86400, {
      value: 86401 * 2,
    })
    assert.equal(tx.receipt.status, true)
    const newExpiry = await baseRegistrar.nameExpires(sha3('test2'))
    assert.equal(newExpiry - oldExpiry, 86400)
    // Check any excess funds are returned
    assert.equal(await web3.eth.getBalance(bulkRenewal.address), 0)
  })
})
