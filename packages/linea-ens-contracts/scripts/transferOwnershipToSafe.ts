import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import 'dotenv/config'
import { Contract } from 'ethers'

const contractsToTransfer = [
  'SimplePublicSuffixList',
  'BaseRegistrarImplementation',
  'ETHRegistrarController',
  'ReverseRegistrar',
  'Root',
  'UniversalResolver',
  'NameWrapper',
  'PohRegistrationManager',
  'PohVerifier',
]

const ETH_NODE =
  '0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae'

async function main(hre: HardhatRuntimeEnvironment) {
  const network = hre.network.name
  const { deployer, owner } = await hre.getNamedAccounts()
  const signer = await ethers.getSigner(owner)

  const deployments = await hre.deployments.all()

  let lineaSafeAddr: string

  switch (network) {
    case 'lineaSepolia':
      if (!process.env.LINEA_SEPOLIA_SAFE) {
        throw 'Env LINEA_SEPOLIA_SAFE can not be undefined'
      }
      lineaSafeAddr = process.env.LINEA_SEPOLIA_SAFE
      break
    case 'lineaMainnet':
      if (!process.env.LINEA_MAINNET_SAFE) {
        throw 'Env LINEA_MAINNET_SAFE can not be undefined'
      }
      lineaSafeAddr = process.env.LINEA_MAINNET_SAFE
      break
    default:
      throw 'Network not supported'
  }

  // Transfer eth node ownernship to safe
  console.log('Transferring ETH node ownership to Linea Safe')
  const ensRegistryDeployed = deployments['ENSRegistry']
  const ensRegistry = new Contract(
    ensRegistryDeployed.address,
    ensRegistryDeployed.abi,
    signer,
  )

  const tx = await ensRegistry.setOwner(ETH_NODE, lineaSafeAddr)
  await tx.wait(1)

  console.log(`ETH node ownership transferred to ${lineaSafeAddr}`)

  console.log(`Transferring contracts's ownership to Linea Safe`)
  for (const contractToTransfer of contractsToTransfer) {
    const currentContract = deployments[contractToTransfer]
    console.log(contractToTransfer)
    const contract = new Contract(
      currentContract.address,
      currentContract.abi,
      signer,
    )
    const tx = await contract.transferOwnership(lineaSafeAddr)
    await tx.wait(1)

    console.log(
      `${contractToTransfer} ownership transferred to ${lineaSafeAddr}`,
    )
  }

  console.log("All contracts's ownership have been transferred")
}

main(require('hardhat') as HardhatRuntimeEnvironment).catch(console.error)
