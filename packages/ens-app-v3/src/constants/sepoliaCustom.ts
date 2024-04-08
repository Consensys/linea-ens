import { defineChain } from 'viem'

export const sepoliaCustom = /* #__PURE__ */ defineChain({
  id: 11_155_111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
      apiUrl: 'https://api-sepolia.etherscan.io/api',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 751532,
    },
    ensRegistry: { address: '0x56c306b6d15287870B9484883335B8a929f97729' },
    ensUniversalResolver: {
      address: '0x35B37282d7f7005DE1c3F867A6C663d4a530E229',
      blockCreated: 5_647_522,
    },
  },
  testnet: true,
})

export const sepoliaCustomEnsAddresses = {
  ensBaseRegistrarImplementation: {
    address: '0x3680EbF9a484B1250E46324328582AbcB53B6791',
  },
  ensBulkRenewal: {
    address: '0x88Cd4C93b97271AaBA45Bf74a3df5178aB2Ef874',
  },
  ensDnsRegistrar: {
    address: '0x964429Cee5760eF8E10d52d7061DbD4A70d8B5F4',
  },
  ensDnssecImpl: {
    address: '0x541B273dE31cd631544a164C6F1679FD2995FD34',
  },
  ensEthRegistrarController: {
    address: '0x65560259405ab2c6a14Aa753e47933a04C8c1b43',
  },
  ensNameWrapper: {
    address: '0x3b365991034a573d54E6D10e88BfacBF2788A23e',
  },
  ensPublicResolver: {
    address: '0xca710b440ad4457eE7a8C02355dcA985B78B7627',
  },
  ensRegistry: {
    address: '0x56c306b6d15287870B9484883335B8a929f97729',
  },
  ensReverseRegistrar: {
    address: '0x8f71DD4896e0f005dC3dAF7435D75CaB8B0A721b',
  },
  ensUniversalResolver: {
    address: '0x35B37282d7f7005DE1c3F867A6C663d4a530E229',
  },
}
