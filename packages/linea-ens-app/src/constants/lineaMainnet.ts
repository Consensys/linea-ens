import { Address, defineChain } from 'viem'

export const lineaMainnet = defineChain({
  id: 59_144,
  name: 'Linea Mainnet',
  network: 'linea-mainnet',
  nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    infura: {
      http: ['https://linea-mainnet.infura.io/v3'],
      webSocket: ['wss://linea-mainnet.infura.io/ws/v3'],
    },
    default: {
      http: ['https://rpc.linea.build'],
      webSocket: ['wss://rpc.linea.build'],
    },
    public: {
      http: ['https://rpc.linea.build'],
      webSocket: ['wss://rpc.linea.build'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://lineascan.build',
    },
    etherscan: {
      name: 'Etherscan',
      url: 'https://lineascan.build',
    },
    blockscout: {
      name: 'Blockscout',
      url: 'https://explorer.linea.build',
    },
  },
  contracts: {
    ensRegistry: {
      address: '0x50130b669B28C339991d8676FA73CF122a121267',
    },
    ensUniversalResolver: {
      address: '0x3aA974fb3f8C1E02796048BDCdeD79e9D53a6965',
      blockCreated: 6_683_000,
    },
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 42,
    },
  },
  testnet: false,
})

export const lineaMainnetEnsAddresses = {
  ensBaseRegistrarImplementation: {
    address: '0x6e84390dCc5195414eC91A8c56A5c91021B95704' as Address,
  },
  ensBulkRenewal: {
    address: '0x236Eaa636f518d1c2252F408FdeaCe2FFfAC79Dc' as Address,
  },
  ensDnsRegistrar: {
    address: '0x103bd37229246c58243b7741DB8b3a22dC578511' as Address,
  },
  ensDnssecImpl: {
    address: '0xBE4C2Cb297Eab1614c43e4Aa9cDCDE71b2678204' as Address,
  },
  ensEthRegistrarController: {
    address: '0xDb75Db974B1F2bD3b5916d503036208064D18295' as Address,
  },
  ensNameWrapper: {
    address: '0xA53cca02F98D590819141Aa85C891e2Af713C223' as Address,
  },
  ensPublicResolver: {
    address: '0x86c5AED9F27837074612288610fB98ccC1733126' as Address,
  },
  ensRegistry: {
    address: '0x50130b669B28C339991d8676FA73CF122a121267' as Address,
  },
  ensReverseRegistrar: {
    address: '0x08D3fF6E65f680844fd2465393ff6f0d742b67D5' as Address,
  },
  ensUniversalResolver: {
    address: '0x3aA974fb3f8C1E02796048BDCdeD79e9D53a6965' as Address,
  },
}
