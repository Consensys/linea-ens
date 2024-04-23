import { Address, defineChain } from 'viem'

export const lineaSepolia = defineChain({
  id: 59_141,
  name: 'Linea Sepolia',
  network: 'linea-sepolia',
  nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    infura: {
      http: ['https://linea-sepolia.infura.io/v3'],
      webSocket: ['wss://linea-sepolia.infura.io/ws/v3'],
    },
    default: {
      http: ['https://rpc.sepolia.linea.build'],
      webSocket: ['wss://rpc.sepolia.linea.build'],
    },
    public: {
      http: ['https://rpc.sepolia.linea.build'],
      webSocket: ['wss://rpc.sepolia.linea.build'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.lineascan.build',
    },
    etherscan: {
      name: 'Etherscan',
      url: 'https://sepolia.lineascan.build',
    },
    blockscout: {
      name: 'Blockscout',
      url: 'https://explorer.sepolia.linea.build',
    },
  },
  contracts: {
    ensRegistry: {
      address: '0x0A3aa096eCf8A240e4086d67056cAf2B810701CB',
    },
    ensUniversalResolver: {
      address: '0x4167C0E7DE2f265A13E2E6B19f26AC4F8C7b4e5f',
      blockCreated: 20_724,
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 14_353_601,
    },
  },
  testnet: true,
})

export const lineaSepoliaEnsAddresses = {
  ensBaseRegistrarImplementation: {
    address: '0x62174a3d52fE325e9eEDbADa06190843835Ac229' as Address,
  },
  ensBulkRenewal: {
    address: '0xb516FdF161fB6ebFB81a4d8731a87c6ae6f14f5E' as Address,
  },
  ensDnsRegistrar: {
    address: '0x4fcc827Ec3Dd237C2F818205676C725684684089' as Address,
  },
  ensDnssecImpl: {
    address: '0x76625a1b11478Aba4Cd39c15376372DDdbFfBa59' as Address,
  },
  ensEthRegistrarController: {
    address: '0x44411C605eb7e009cad03f3847cfbbFCF8895130' as Address,
  },
  ensNameWrapper: {
    address: '0xf629e307dC59d82AE1C8e30fAa65E9486cFADD96' as Address,
  },
  ensPublicResolver: {
    address: '0x310D7A96d8179bf4601b22299643Bf39b3fBcbb8' as Address,
  },
  ensRegistry: {
    address: '0x0A3aa096eCf8A240e4086d67056cAf2B810701CB' as Address,
  },
  ensReverseRegistrar: {
    address: '0x2b5E02975bD875ca4ED565E69B19a96d8C0f0E23' as Address,
  },
  ensUniversalResolver: {
    address: '0x4167C0E7DE2f265A13E2E6B19f26AC4F8C7b4e5f' as Address,
  },
}
