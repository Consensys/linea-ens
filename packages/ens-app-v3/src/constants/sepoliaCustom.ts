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
    ensRegistry: { address: '0xCeF1e850d0207B237Ae91e64037072F93C76aE35' },
    ensUniversalResolver: {
      address: '0x7263bA3b95Ae6177dC39D22f7eF4E277806E8aCF',
      blockCreated: 5_710_989,
    },
  },
  testnet: true,
})

export const sepoliaCustomEnsAddresses = {
  ensBaseRegistrarImplementation: {
    address: '0x2372154B01F1071b2f2BB02e93Ab97404f1F7a76',
  },
  ensBulkRenewal: {
    address: '0x05341E05dc959eF86E08a41883F5B478947B790D',
  },
  ensDnsRegistrar: {
    address: '0x88eeA2489dCc3BeF6439E65a413b68F1a23F1DCf',
  },
  ensDnssecImpl: {
    address: '0x45FC85e99c62359d2A778d759FA36dF3D53a31D4',
  },
  ensEthRegistrarController: {
    address: '0x77D2a098D81580633091529FB93953dE9180c0c0',
  },
  ensNameWrapper: {
    address: '0xB496f723a0180418b0F15e2b1af7d60BBa8Afeb1',
  },
  ensPublicResolver: {
    address: '0xA4254Ba887ea0813A3F265A7442fAFa68E21a6bb',
  },
  ensRegistry: {
    address: '0xCeF1e850d0207B237Ae91e64037072F93C76aE35',
  },
  ensReverseRegistrar: {
    address: '0xDf307b640a95E6ed82798Eb41A5f388D0eF75C38',
  },
  ensUniversalResolver: {
    address: '0x7263bA3b95Ae6177dC39D22f7eF4E277806E8aCF',
  },
}
