import { ethers } from 'ethers'
import 'dotenv/config'

import registrarControllerAbi from '../deployments/lineaSepolia/ETHRegistrarController.json'
import resolverAbi from '../deployments/lineaSepolia/PublicResolver.json'

const registrarControllerAddress = registrarControllerAbi.address
const resolverAddress = resolverAbi.address // PublicResolver address

const provider = new ethers.providers.JsonRpcProvider(
  `https://linea-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
)
if (!process.env.POH_ADDRESS_KEY) {
  throw new Error('POH_ADDRESS_KEY environment variable is not set.')
}
const wallet = new ethers.Wallet(process.env.POH_ADDRESS_KEY, provider)
const registrarController = new ethers.Contract(
  registrarControllerAddress,
  registrarControllerAbi.abi,
  wallet,
)
const resolver = new ethers.Contract(resolverAddress, resolverAbi.abi, wallet)

// Domain details
const domainName = 'testpoh'
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

  const signature =
    '0x612be7d3bd6d2282631996b2c2fe4ea43f790d28b19d616ed91d7a74ccb8780b52d2155163924ed2f253ebf572828324ce7b5faffdcdb4eca1ff30a9e3117b5f1c'

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
    )
    await txRegisterPoh.wait()

    console.log(
      `Domain registered with PoH:', ${domainName}.${process.env.BASE_DOMAIN}.eth`,
    )
  }, (60 + 60) * 1000)
}

main().catch(console.error)
