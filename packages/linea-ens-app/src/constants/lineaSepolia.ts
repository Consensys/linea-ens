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
      address: '0x5B2636F0f2137B4aE722C01dd5122D7d3e9541f7',
    },
    ensUniversalResolver: {
      address: '0x72560a31B3DAEE82B984a7F51c6b3b1bb7CC9F50',
      blockCreated: 2_395_255,
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 227_427,
    },
  },
  testnet: true,
})

export const lineaSepoliaEnsAddresses = {
  ensBaseRegistrarImplementation: {
    address: '0x83475a84C0ea834F06c8e636A62631e7d2e07A44' as Address,
  },
  ensBulkRenewal: {
    address: '0x8056dDA2f1fa06b7408f307E3a9f8c36416Bddf9' as Address,
  },
  ensDnsRegistrar: {
    address: '0x1d1CCf98581b690AC45852D5264382C4f2285094' as Address,
  },
  ensDnssecImpl: {
    address: '0xe34B0fD618CFac339fFE3f6A1E53D7DB95Cd9daB' as Address,
  },
  ensEthRegistrarController: {
    address: '0x0f81E3B3A32DFE1b8A08d3C0061d852337a09338' as Address,
  },
  ensNameWrapper: {
    address: '0xF127De9E039a789806fEd4C6b1C0f3aFfeA9425e' as Address,
  },
  ensPublicResolver: {
    address: '0xA2008916Ed2d7ED0Ecd747a8a5309267e42cf1f1' as Address,
  },
  ensRegistry: {
    address: '0x5B2636F0f2137B4aE722C01dd5122D7d3e9541f7' as Address,
  },
  ensReverseRegistrar: {
    address: '0x4aAA964D8EB65508ca3DA3b0A3C060c16059E613' as Address,
  },
  ensUniversalResolver: {
    address: '0x72560a31B3DAEE82B984a7F51c6b3b1bb7CC9F50' as Address,
  },
}
