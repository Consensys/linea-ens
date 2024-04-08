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
    '0xb998ef2a75d94d76e0d2b5bbafa01edb40e7d2f955b59a2ea115afeada4b273365d433516e1597a726ca8c2a3dda27147830a9f6f8db3fb5184dd7a9df5d77c31b'
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

    console.log(
      `Domain registered with PoH:', ${domainName}.${process.env.BASE_DOMAIN}.eth`,
    )
  }, (60 + 60) * 1000)
}

main().catch(console.error)
