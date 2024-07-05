import { Interface } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const { makeInterfaceId } = require('@openzeppelin/test-helpers')

function computeInterfaceId(iface: Interface) {
  return makeInterfaceId.ERC165(
    Object.values(iface.functions).map((frag) => frag.format('sighash')),
  )
}

function encodeDomainToDNSFormat(domain: string): Uint8Array {
  // Split the domain into its labels (parts between the dots)
  const labels = domain.split('.')

  // Initialize an array to hold the binary data
  const binaryData: number[] = []

  // For each label, add its length as a single byte, followed by the ASCII values of its characters
  labels.forEach((label) => {
    binaryData.push(label.length) // Length of the label
    for (let i = 0; i < label.length; i++) {
      binaryData.push(label.charCodeAt(i)) // ASCII value of each character
    }
  })

  // Append 0 to indicate the end of the domain name
  binaryData.push(0)

  // Convert the binary data array to a Uint8Array
  return new Uint8Array(binaryData)
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!process.env.BASE_DOMAIN) {
    throw 'BASE_DOMAIN env has to be defined'
  }

  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const registry = await ethers.getContract('ENSRegistry', owner)
  const registrar = await ethers.getContract(
    'BaseRegistrarImplementation',
    owner,
  )
  const metadata = await ethers.getContract('StaticMetadataService', owner)
  const baseDomain = `${process.env.BASE_DOMAIN}.eth`
  const baseNode = ethers.utils.namehash(baseDomain)
  const baseNodeDnsEncoded = encodeDomainToDNSFormat(baseDomain)

  const deployArgs = {
    from: deployer,
    args: [
      registry.address,
      registrar.address,
      metadata.address,
      baseNode,
      baseNodeDnsEncoded,
    ],
    log: true,
  }

  const nameWrapper = await deploy('NameWrapper', deployArgs)
  if (!nameWrapper.newlyDeployed) return

  if (owner !== deployer) {
    const wrapper = await ethers.getContract('NameWrapper', deployer)
    const tx = await wrapper.transferOwnership(owner)
    console.log(
      `Transferring ownership of NameWrapper to ${owner} (tx: ${tx.hash})...`,
    )
    await tx.wait()
  }

  // Only attempt to make controller etc changes directly on testnets
  if (network.name === 'mainnet') return

  const tx2 = await registrar.addController(nameWrapper.address)
  console.log(
    `Adding NameWrapper as controller on registrar (tx: ${tx2.hash})...`,
  )
  await tx2.wait()

  const artifact = await deployments.getArtifact('INameWrapper')
  const interfaceId = computeInterfaceId(new Interface(artifact.abi))
  const resolver = await registry.resolver(ethers.utils.namehash('eth'))
  if (resolver === ethers.constants.AddressZero) {
    console.log(
      `No resolver set for .eth; not setting interface ${interfaceId} for NameWrapper`,
    )
    return
  }
  const resolverContract = await ethers.getContractAt('OwnedResolver', resolver)
  const tx3 = await resolverContract.setInterface(
    ethers.utils.namehash('eth'),
    interfaceId,
    nameWrapper.address,
  )
  console.log(
    `Setting NameWrapper interface ID ${interfaceId} on .eth resolver (tx: ${tx3.hash})...`,
  )
  await tx3.wait()
}

func.id = 'name-wrapper'
func.tags = ['wrapper', 'NameWrapper']
func.dependencies = [
  'StaticMetadataService',
  'registry',
  'ReverseRegistrar',
  'OwnedResolver',
]

export default func
