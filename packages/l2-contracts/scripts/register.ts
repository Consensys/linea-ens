import { ethers } from 'ethers'
import 'dotenv/config'

import registrarControllerAbi from '../deployments/sepolia/ETHRegistrarController.json'
import resolverAbi from '../deployments/sepolia/PublicResolver.json'

const registrarControllerAddress = registrarControllerAbi.address
const resolverAddress = resolverAbi.address // PublicResolver address

const provider = new ethers.providers.JsonRpcProvider(
  `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
)
if (!process.env.OWNER_PRIVATE_KEY) {
  throw new Error('OWNER_PRIVATE_KEY environment variable is not set.')
}
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider)
const registrarController = new ethers.Contract(
  registrarControllerAddress,
  registrarControllerAbi.abi,
  wallet,
)
const resolver = new ethers.Contract(resolverAddress, resolverAbi.abi, wallet)

// Domain details
const domainName = 'longname'
const duration = 365 * 24 * 60 * 60 // 1 year in seconds
const secret = ethers.utils.formatBytes32String('SECRET')

async function main() {
  const owner = wallet.address
  const reverseRecord = true
  const ownerControlledFuses = 0 // Fuses, 0 for no restrictions

  // Encode the calls to the resolver contract
  const data = [
    resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
      ethers.utils.namehash(
        domainName + '.' + process.env.BASE_DOMAIN + '.eth',
      ),
      owner,
    ]),
  ]

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

  // Commit the commitment
  const txCommit = await registrarController.commit(commitment)
  await txCommit.wait()

  console.log('Commitment made. Waiting for the minCommitmentAge...')

  // Wait for the minCommitmentAge + a buffer (1 minute) to ensure the commitment is ready
  setTimeout(async () => {
    // Register the domain
    const txRegister = await registrarController.register(
      domainName,
      owner,
      duration,
      secret,
      resolverAddress,
      data,
      reverseRecord,
      ownerControlledFuses,
      {
        value: ethers.utils.parseEther('0.01'),
        gasLimit: 1000_000,
      },
    )
    await txRegister.wait()

    console.log(
      `Domain registered:', ${domainName}.${process.env.BASE_DOMAIN}.eth`,
    )
  }, (60 + 60) * 1000)
}

main().catch(console.error)
