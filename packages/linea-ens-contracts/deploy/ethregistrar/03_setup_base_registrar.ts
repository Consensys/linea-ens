import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { keccak256 } from 'js-sha3'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, network } = hre
  const { deployer, owner } = await getNamedAccounts()

  if (!process.env.BASE_DOMAIN) {
    throw 'BASE_DOMAIN env has to be defined'
  }

  if (!network.tags.use_root) {
    return true
  }

  const root = await ethers.getContract('Root')
  const registrar = await ethers.getContract('BaseRegistrarImplementation')

  console.log('Running base registrar setup')

  const tx1 = await registrar.transferOwnership(owner, { from: deployer })
  console.log(
    `Transferring ownership of registrar to owner (tx: ${tx1.hash})...`,
  )
  await tx1.wait()

  const tx2 = await root
    .connect(await ethers.getSigner(owner))
    .setSubnodeOwner('0x' + keccak256('eth'), owner)
  console.log(`Setting owner of eth node to owner on root (tx: ${tx2.hash})...`)
  await tx2.wait()

  const ens = await ethers.getContract('ENSRegistry')
  const tx3 = await ens
    .connect(await ethers.getSigner(owner))
    .setSubnodeOwner(
      ethers.utils.namehash('eth'),
      '0x' + keccak256(process.env.BASE_DOMAIN),
      registrar.address,
    )
  console.log(
    `Setting owner of ${process.env.BASE_DOMAIN}.eth node to registrar (tx: ${tx2.hash})...`,
  )
  await tx3.wait()
}

func.id = 'setupRegistrar'
func.tags = ['setupRegistrar']
//Runs after the root is setup
func.dependencies = ['setupRoot']

export default func
