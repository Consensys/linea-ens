import { defineChain } from 'viem'

export const sepoliaCustom = /*#__PURE__*/ defineChain({
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
    ensRegistry: { address: '0x9125C4f492Ca725A2EAE5d9Df5643F6f41Fe77BE' },
    ensUniversalResolver: {
      address: '0xc220298fc159a220cF5B1d0d13f41905b516750A',
      blockCreated: 5_570_763,
    },
  },
  testnet: true,
})

export const sepoliaCustomEnsAddresses = {
  ensBaseRegistrarImplementation: {
    address: '0x0d5446e2050DCDc373DbB13A2e6a81D89E85FEb6',
  },
  ensBulkRenewal: {
    address: '0xC3D5b20d5836Eba0bf4Cd006E8A67AA4ae33b7da',
  },
  ensDnsRegistrar: {
    address: '0xcE4694e52Ce8fd7961e05b4a261284B6e990ccB8',
  },
  ensDnssecImpl: {
    address: '0x33AA3713a15DaEC42cB834Df9aA8916d15090f85',
  },
  ensEthRegistrarController: {
    address: '0xE2f076220c4e456A10398A8482d84BE1E8b82516',
  },
  ensNameWrapper: {
    address: '0x0Fb19ba94805a816471C84c90F167285bA888FD3',
  },
  ensPublicResolver: {
    address: '0x7161c2eEf390ef14053E13012D6E761938820127',
  },
  ensRegistry: {
    address: '0x9125C4f492Ca725A2EAE5d9Df5643F6f41Fe77BE',
  },
  ensReverseRegistrar: {
    address: '0xD0Ed1FaA2C78012Dc506FA5f67939778963008f3',
  },
  ensUniversalResolver: {
    address: '0xc220298fc159a220cF5B1d0d13f41905b516750A',
  },
}
