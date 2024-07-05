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
      address: '0x778412cf5F9f1492EACC5794D8b75141FF4655d3',
    },
    ensUniversalResolver: {
      address: '0xe9F3277f4839CD08652B537F1bbbB40F0AaF40D3',
      blockCreated: 1_196_299,
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
    address: '0x0Dc86D89d9ac503a97162aF33B7B31D574e4c4af' as Address,
  },
  ensBulkRenewal: {
    address: '0xA9245A256560190eA4741317EE1163A58E85e0a2' as Address,
  },
  ensDnsRegistrar: {
    address: '0xC61AdFd4f0457B81Ae5E4B7363d2Be7c6Ecd5Cf9' as Address,
  },
  ensDnssecImpl: {
    address: '0x794f1ca4b7107F6d6dCd863E53FC406306C7573D' as Address,
  },
  ensEthRegistrarController: {
    address: '0x45FC85e99c62359d2A778d759FA36dF3D53a31D4' as Address,
  },
  ensNameWrapper: {
    address: '0xE0Ceb5D0C15E6d4369696A2cb1e2133904299270' as Address,
  },
  ensPublicResolver: {
    address: '0x5bDA6a6B90452e8a399B412E70915B61Dd50c82B' as Address,
  },
  ensRegistry: {
    address: '0x778412cf5F9f1492EACC5794D8b75141FF4655d3' as Address,
  },
  ensReverseRegistrar: {
    address: '0x2372154B01F1071b2f2BB02e93Ab97404f1F7a76' as Address,
  },
  ensUniversalResolver: {
    address: '0xe9F3277f4839CD08652B537F1bbbB40F0AaF40D3' as Address,
  },
}
