import { ethers } from 'ethers'
import * as fs from 'fs'
require('dotenv').config({ path: '../.env' })

const registrarControllerAbi = JSON.parse(fs.readFileSync('./RegistrarController_abi.json', 'utf8'))


const registrarControllerAddress = '0x44411C605eb7e009cad03f3847cfbbFCF8895130'

const provider = new ethers.providers.JsonRpcProvider(
  `https://linea-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
)
if (!process.env.OWNER_KEY) {
  throw new Error('OWNER_KEY environment variable is not set.')
}
const wallet = new ethers.Wallet(process.env.OWNER_KEY, provider)
const registrarController = new ethers.Contract(registrarControllerAddress, registrarControllerAbi, wallet)

// Domain details
const domainName = 'amine.linea'
const duration = 365 * 24 * 60 * 60 // 1 year in seconds
const secret = ethers.utils.formatBytes32String('SECRET') //

async function main() {
  // Step 1: Make a commitment
  const owner = wallet.address
  //const resolver = ethers.constants.AddressZero;
  const resolverAddress = '0x310D7A96d8179bf4601b22299643Bf39b3fBcbb8' // PublicResolver address
  const data: string[] = []
  const reverseRecord = false
  const ownerControlledFuses = 0 // Fuses, 0 for no restrictions

  const commitment = await registrarController.makeCommitment(
    domainName,
    owner,
    duration,
    secret,
    resolverAddress,
    data,
    reverseRecord,
    ownerControlledFuses,
  )

  // Step 2: Commit the commitment
  const txCommit = await registrarController.commit(commitment)
  await txCommit.wait()

  console.log('Commitment made. Waiting for the minCommitmentAge...')

  // Wait for the minCommitmentAge + a buffer (1 minute) to ensure the commitment is ready
  setTimeout(async () => {
    // Step 3: Register the domain
    const txRegister = await registrarController.register(
      domainName,
      owner,
      duration,
      secret,
      resolverAddress,
      data,
      reverseRecord,
      ownerControlledFuses,
      { value: ethers.utils.parseEther('0.01') },
    )
    await txRegister.wait()

    console.log('Domain registered:', domainName + '.eth')
  }, (60 + 60) * 1000)
}


main().catch(console.error)
