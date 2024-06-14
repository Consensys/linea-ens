import fs from 'fs'
import { parse } from 'csv-parse'
import 'dotenv/config'
import { Contract } from 'ethers'
import path from 'path'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import axios from 'axios'
import ethers from 'ethers'

interface Abi {
  address: string
  abi: any[]
}

const loadAbi = (path: string): Abi => {
  try {
    return require(path)
  } catch (error) {
    console.error(`Failed to load ABI from ${path}:`, error)
    process.exit(1)
  }
}

async function main(hre: HardhatRuntimeEnvironment) {
  const network = hre.network.name

  let registrarControllerAbi: Abi
  let resolverAbi: Abi
  let rpcUrl: string
  let web3SignerUrl = `${process.env.WEB3_SIGNER_URL}/api/v1/eth1/sign/${process.env.WEB3_SIGNER_PUBLIC_KEY}`
  let provider

  switch (network) {
    case 'lineaSepolia':
      registrarControllerAbi = loadAbi(
        '../deployments/LineaSepolia/ETHRegistrarController.json',
      )
      resolverAbi = loadAbi('../deployments/LineaSepolia/PublicResolver.json')
      rpcUrl = `https://linea-sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
      break
    case 'mainnet':
      registrarControllerAbi = loadAbi(
        '../deployments/mainnet/ETHRegistrarController.json',
      )
      resolverAbi = loadAbi('../deployments/mainnet/PublicResolver.json')
      rpcUrl = `https://linea-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
      break
    default:
      registrarControllerAbi = loadAbi(
        '../deployments/localhost/ETHRegistrarController.json',
      )
      resolverAbi = loadAbi('../deployments/localhost/PublicResolver.json')
      rpcUrl = 'http://localhost:8545'
      break
  }

  provider = new hre.ethers.providers.JsonRpcProvider(rpcUrl)

  const registrarControllerAddress = registrarControllerAbi.address
  const resolverAddress = resolverAbi.address

  const CSV_FILE_PATH = path.resolve(__dirname, './domains.csv')
  const DURATION = 365 * 99 * 24 * 60 * 60 // 99 years in seconds
  const OWNER_CONTROLLED_FUSES = 0 // Fuses, 0 for no restrictions
  const REVERSE_RECORD = true

  async function registerDomain(
    domainName: string,
    ownerAddress: string,
    registrarController: Contract,
    resolver: Contract,
    contractOwner: string,
    provider: ethers.providers.JsonRpcProvider,
  ) {
    const fullDomainName = `${domainName}.${process.env.BASE_DOMAIN}.eth`
    const namehash = hre.ethers.utils.namehash(fullDomainName)

    const data = [
      resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
        namehash,
        ownerAddress,
      ]),
    ]

    console.log(`Data for ${domainName}:`, data)

    try {
      const estimatedGasLimit =
        await registrarController.estimateGas.ownerRegister(
          domainName,
          ownerAddress,
          DURATION,
          resolver.address,
          data,
          OWNER_CONTROLLED_FUSES,
          REVERSE_RECORD,
          { from: contractOwner },
        )

      console.log(
        `Estimated gas limit for ${domainName}: ${estimatedGasLimit.toString()}`,
      )

      const gasPrice = await provider.getGasPrice()
      const nonce = await provider.getTransactionCount(contractOwner)

      const tx = await registrarController.populateTransaction.ownerRegister(
        domainName,
        ownerAddress,
        DURATION,
        resolver.address,
        data,
        OWNER_CONTROLLED_FUSES,
        REVERSE_RECORD,
        {
          gasLimit: estimatedGasLimit,
          value: 0,
          type: 2,
          nonce,
          from: contractOwner,
          maxFeePerGas: gasPrice,
          maxPriorityFeePerGas: gasPrice,
        },
      )

      // We can't add it directly to the populateTransaction function
      tx.chainId = provider.network.chainId

      const serializedTx = hre.ethers.utils.serializeTransaction(tx)

      const { data: signature, status } = await axios.post(web3SignerUrl, {
        data: serializedTx,
      })

      const serializedSignedTx = hre.ethers.utils.serializeTransaction(
        tx,
        signature,
      )

      const response = await provider.sendTransaction(serializedSignedTx)

      console.log(`Domain ${domainName} registered successfully.`)
    } catch (error: any) {
      console.error(`Failed to register domain ${domainName}:`, error)
      if (error?.error?.data) {
        const revertReason = hre.ethers.utils.toUtf8String(
          '0x' + error.error.data.substr(138),
        )
        console.error('Revert reason:', revertReason)
      }
    }
  }

  const registrarController = new Contract(
    registrarControllerAddress,
    registrarControllerAbi.abi,
    provider,
  )
  const resolver = new Contract(resolverAddress, resolverAbi.abi, provider)

  const registrarControllerOwner = await registrarController.owner()
  console.log(`RegistrarController owner: ${registrarControllerOwner}`)

  // Parse CSV file
  const domains: { domain: string; owner: string }[] = []

  fs.createReadStream(CSV_FILE_PATH)
    .pipe(parse({ columns: true }))
    .on('data', (row) => {
      domains.push({ domain: row.domain, owner: row.owner })
    })
    .on('end', async () => {
      console.log('CSV file successfully processed')
      for (const { domain, owner } of domains) {
        console.log(`Processing domain: ${domain}, owner: ${owner}`)
        await registerDomain(
          domain,
          owner,
          registrarController,
          resolver,
          registrarControllerOwner,
          provider,
        )
      }
    })
}

main(require('hardhat') as HardhatRuntimeEnvironment).catch(console.error)
