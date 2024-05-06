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
      address: '0xE97Af0570d58aDa8cA7C07fba1A4440D1ADF90e5',
    },
    ensUniversalResolver: {
      address: '0xd55E0f08dEd3B2c4c76609DC8959acD9a0822a2e',
      blockCreated: 587_880,
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
    address: '0x1f7fA08a66E26d470C631Fea0816079d8ff11835' as Address,
  },
  ensBulkRenewal: {
    address: '0x6Fd7f3d232Ac3ed853b5f7BEB10156A586B882e0' as Address,
  },
  ensDnsRegistrar: {
    address: '0x031d41954b0eFbADC1027a61eFC30Af881198dDa' as Address,
  },
  ensDnssecImpl: {
    address: '0x17742516879b525767fCcBA0a8c6C432b6A13217' as Address,
  },
  ensEthRegistrarController: {
    address: '0x2aA3Ffb6eD4e4f8237Ae0Ba060B9765c54EF5C31' as Address,
  },
  ensNameWrapper: {
    address: '0x4912556B28A464C7572E8f14Db81A7c77F2d2957' as Address,
  },
  ensPublicResolver: {
    address: '0xEcC9Ebbc93BE05d014E3A4cf19B45cdC975cc709' as Address,
  },
  ensRegistry: {
    address: '0xE97Af0570d58aDa8cA7C07fba1A4440D1ADF90e5' as Address,
  },
  ensReverseRegistrar: {
    address: '0xea8Af0e31a46D49e69c71AF3efE86F5432386848' as Address,
  },
  ensUniversalResolver: {
    address: '0xd55E0f08dEd3B2c4c76609DC8959acD9a0822a2e' as Address,
  },
}
