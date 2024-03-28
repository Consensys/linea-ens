import { ethers } from 'ethers'
import 'dotenv/config'

import registrarControllerAbi from '../deployments/lineaSepolia/ETHRegistrarController.json'
import resolverAbi from '../deployments/lineaSepolia/PublicResolver.json'

const registrarControllerAddress = registrarControllerAbi.address
const resolverAddress = resolverAbi.address // PublicResolver address

const provider = new ethers.providers.JsonRpcProvider(
  `https://linea-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
)
if (!process.env.OWNER_KEY) {
  throw new Error('OWNER_KEY environment variable is not set.')
}
const wallet = new ethers.Wallet(process.env.OWNER_KEY, provider)
const registrarController = new ethers.Contract(
  registrarControllerAddress,
  registrarControllerAbi.abi,
  wallet,
)
const resolver = new ethers.Contract(resolverAddress, resolverAbi.abi, wallet)

// Domain details
const domainName = 'testpoh.linea'
const duration = 365 * 24 * 60 * 60 // 1 year in seconds
const secret = ethers.utils.formatBytes32String('SECRET')

async function main() {
  const owner = wallet.address
  const reverseRecord = true
  const ownerControlledFuses = 0 // Fuses, 0 for no restrictions

  // Encode the calls to the resolver contract
  const data = [
    resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
      ethers.utils.namehash(domainName + '.eth'),
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

  const signature =
    '0xa5cac7e279a8f9c52fbe7f565334e8e83a013afa1448608de97243f3b5dd58d617b82f594de9f2f4906126ba17a122a4bd05e0742b8fa0783030660e37deb1e71c'
  const human = owner

  // Wait for the minCommitmentAge + a buffer (1 minute) to ensure the commitment is ready
  setTimeout(async () => {
    // Register the domain using registerPoh
    const txRegisterPoh = await registrarController.registerPoh(
      domainName,
      owner,
      duration,
      secret,
      resolverAddress,
      data,
      reverseRecord,
      ownerControlledFuses,
      signature,
      human,
      {
        value: ethers.utils.parseEther('0.01'),
        gasLimit: 1000_000,
      },
    )
    await txRegisterPoh.wait()

    console.log('Domain registered with PoH:', domainName + '.eth')
  }, (60 + 60) * 1000)
}

main().catch(console.error)