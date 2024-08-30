import { keccak256 } from 'js-sha3'
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  if (!process.env.BASE_DOMAIN) {
    throw 'BASE_DOMAIN env has to be defined'
  }

  const registry = await ethers.getContract('ENSRegistry', owner)
  const nameWrapper = await ethers.getContract('NameWrapper', owner)
  const controller = await ethers.getContract('ETHRegistrarController', owner)
  const reverseRegistrar = await ethers.getContract('ReverseRegistrar', owner)
  const registrar = await ethers.getContract(
    'BaseRegistrarImplementation',
    owner,
  )
  const baseNode = ethers.utils.namehash(`${process.env.BASE_DOMAIN}.eth`)
  const ETH_COIN_TYPE = 60
  const LINEA_COIN_TYPE = 2147542792

  const deployArgs = {
    from: deployer,
    args: [
      registry.address,
      nameWrapper.address,
      controller.address,
      reverseRegistrar.address,
    ],
    log: true,
  }
  const publicResolver = await deploy('PublicResolver', deployArgs)
  if (!publicResolver.newlyDeployed) return

  const tx = await reverseRegistrar.setDefaultResolver(publicResolver.address)
  console.log(
    `Setting default resolver on ReverseRegistrar to PublicResolver (tx: ${tx.hash})...`,
  )
  await tx.wait()

  if ((await registry.owner(ethers.utils.namehash('resolver.eth'))) === owner) {
    const pr = (await ethers.getContract('PublicResolver')).connect(
      await ethers.getSigner(owner),
    )
    const resolverHash = ethers.utils.namehash('resolver.eth')
    const tx2 = await registry.setResolver(resolverHash, pr.address)
    console.log(
      `Setting resolver for resolver.eth to PublicResolver (tx: ${tx2.hash})...`,
    )
    await tx2.wait()

    const tx3 = await pr['setAddr(bytes32,address)'](resolverHash, pr.address)
    console.log(
      `Setting address for resolver.eth to PublicResolver (tx: ${tx3.hash})...`,
    )
    await tx3.wait()
  } else {
    console.log(
      'resolver.eth is not owned by the owner address, not setting resolver',
    )
  }

  // Set the ETH record for the base domain and give the ownership back to the base registrar
  const tx4 = await registry
    .connect(await ethers.getSigner(owner))
    .setSubnodeOwner(
      ethers.utils.namehash('eth'),
      '0x' + keccak256(process.env.BASE_DOMAIN),
      owner,
    )
  console.log(
    `Setting owner of ${process.env.BASE_DOMAIN}.eth node to owner (tx: ${tx4.hash})...`,
  )
  await tx4.wait()

  const pr = new ethers.Contract(
    publicResolver.address,
    publicResolver.abi,
    await ethers.getSigner(owner),
  )

  const tx5 = await pr['setAddr(bytes32,uint256,bytes)'](
    baseNode,
    ETH_COIN_TYPE,
    registrar.address,
  )
  console.log(
    `Setting ETH record address for ${process.env.BASE_DOMAIN}.eth node to registrar address ${registrar.address} (tx: ${tx5.hash})...`,
  )
  await tx5.wait()

  const tx6 = await pr['setAddr(bytes32,uint256,bytes)'](
    baseNode,
    LINEA_COIN_TYPE,
    registrar.address,
  )
  console.log(
    `Setting Linea record address for ${process.env.BASE_DOMAIN}.eth node to registrar address ${registrar.address} (tx: ${tx6.hash})...`,
  )
  await tx6.wait()

  const tx7 = await registry
    .connect(await ethers.getSigner(owner))
    .setSubnodeOwner(
      ethers.utils.namehash('eth'),
      '0x' + keccak256(process.env.BASE_DOMAIN),
      registrar.address,
    )
  console.log(
    `Setting back owner of ${process.env.BASE_DOMAIN}.eth node to registrar (tx: ${tx7.hash})...`,
  )
  await tx7.wait()
}

func.id = 'resolver'
func.tags = ['resolvers', 'PublicResolver']
func.dependencies = [
  'registry',
  'ETHRegistrarController',
  'NameWrapper',
  'ReverseRegistrar',
]

export default func
