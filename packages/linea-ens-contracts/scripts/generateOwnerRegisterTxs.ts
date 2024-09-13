import fs from 'fs'
import resolverJson from '../deployments/lineaMainnet/PublicResolver.json'
import { ethers } from 'ethers'
import path from 'path'
import { parse } from 'csv-parse'

const CSV_FILE_PATH = path.resolve(__dirname, './domains.csv')
const RESULT_CSV_FILE_PATH = path.resolve(__dirname, './result.json')

const txs: {
  to: string
  value: string
  data: null
  contractMethod: {
    inputs: { internalType: string; name: string; type: string }[]
    name: string
    payable: boolean
  }
  contractInputsValues: {
    name: string
    owner: string
    duration: string
    resolver: string
    data: string
    ownerControlledFuses: string
    reverseRecord: string
  }
}[] = []

fs.createReadStream(CSV_FILE_PATH)
  .pipe(parse({ columns: true }))
  .on('data', (data: { owner: string; domain: string }) =>
    processDomain(data.owner, data.domain),
  )
  .on('end', () => {
    // Process the CSV data
    const result = {
      version: '1.0',
      chainId: '59144',
      createdAt: 1726144999725,
      meta: {
        name: 'Transactions Batch',
        description: '',
        txBuilderVersion: '1.16.5',
        createdFromSafeAddress: '0x9280D881b0180a5e2c378f6bb6071c905b070C97',
        createdFromOwnerAddress: '',
        checksum:
          '0x6c503b6f029a7a70f378e6a3629589a2047888c03604463f09fb2c4938a98c3f',
      },
      transactions: txs,
    }

    fs.writeFileSync(RESULT_CSV_FILE_PATH, JSON.stringify(result))

    console.log('Done, written to', RESULT_CSV_FILE_PATH)
  })

const LINEA_COIN_TYPE = 2147542792

const resolverIface = ethers.Contract.getInterface(resolverJson.abi)

function processDomain(owner: string, domain: string) {
  console.log(`Domain: ${domain}, Owner: ${owner}`)

  const fullDomainName = `${domain}.linea.eth`
  const namehash = ethers.utils.namehash(fullDomainName)

  const data = [
    resolverIface.encodeFunctionData('setAddr(bytes32,address)', [
      namehash,
      owner,
    ]),
    resolverIface.encodeFunctionData('setAddr(bytes32,uint256,bytes)', [
      namehash,
      LINEA_COIN_TYPE,
      owner,
    ]),
  ]

  const tx = {
    to: '0xDb75Db974B1F2bD3b5916d503036208064D18295',
    value: '0',
    data: null,
    contractMethod: {
      inputs: [
        {
          internalType: 'string',
          name: 'name',
          type: 'string',
        },
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'duration',
          type: 'uint256',
        },
        {
          internalType: 'address',
          name: 'resolver',
          type: 'address',
        },
        {
          internalType: 'bytes[]',
          name: 'data',
          type: 'bytes[]',
        },
        {
          internalType: 'uint16',
          name: 'ownerControlledFuses',
          type: 'uint16',
        },
        {
          internalType: 'bool',
          name: 'reverseRecord',
          type: 'bool',
        },
      ],
      name: 'ownerRegister',
      payable: false,
    },
    contractInputsValues: {
      name: domain,
      owner: owner,
      duration: '3122064000',
      resolver: '0x86c5AED9F27837074612288610fB98ccC1733126',
      data: JSON.stringify(data),
      ownerControlledFuses: '0',
      reverseRecord: 'true',
    },
  }

  txs.push(tx)
}
