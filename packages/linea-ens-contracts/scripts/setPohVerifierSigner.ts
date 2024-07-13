import { ethers } from 'hardhat'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import 'dotenv/config'
import pohVerifierLineaSepolia from '../deployments/lineaSepolia/PohVerifier.json'
import { Contract } from 'ethers'
import pohVerifierLineaMainnet from '../deployments/lineaMainnet/PohVerifier.json'

async function main(hre: HardhatRuntimeEnvironment) {
  const network = hre.network.name
  const { deployer, owner } = await hre.getNamedAccounts()
  const signer = await ethers.getSigner(owner)

  let pohVerifier: Contract
  let pohSignerAddr: string

  switch (network) {
    case 'lineaSepolia':
      if (!process.env.POH_SIGNER_LINEA_SEPOLIA) {
        throw 'Env POH_SIGNER_LINEA_SEPOLIA can not be undefined'
      }
      pohSignerAddr = process.env.POH_SIGNER_LINEA_SEPOLIA
      pohVerifier = new ethers.Contract(
        pohVerifierLineaSepolia.address,
        pohVerifierLineaSepolia.abi,
        signer,
      )
      break
    case 'lineaMainnet':
      if (!process.env.POH_SIGNER_LINEA_MAINNET) {
        throw 'Env POH_SIGNER_LINEA_MAINNET can not be undefined'
      }
      pohSignerAddr = process.env.POH_SIGNER_LINEA_MAINNET
      pohVerifier = new ethers.Contract(
        pohVerifierLineaMainnet.address,
        pohVerifierLineaMainnet.abi,
        signer,
      )
      break
    default:
      throw 'Network not supported'
  }

  const tx = await pohVerifier.setSigner(pohSignerAddr)
  await tx.wait(1)

  console.log(`PohVerifier signer set to ${pohSignerAddr}`)
}

main(require('hardhat') as HardhatRuntimeEnvironment).catch(console.error)
