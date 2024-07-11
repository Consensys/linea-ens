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
