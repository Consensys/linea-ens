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
    ensRegistry: { address: '0x82D6247c272Ae0AB7AA2946ee688e74dAB976c67' },
    ensUniversalResolver: {
      address: '0xbfBBFcd69651303A65D91741500C008631A9D8a0',
      blockCreated: 5_619_027,
    },
  },
  testnet: true,
})

export const sepoliaCustomEnsAddresses = {
  ensBaseRegistrarImplementation: {
    address: '0x7A6D957A8F18e55a03ff6DC11Fd990fc95Df5e1F',
  },
  ensBulkRenewal: {
    address: '0xdae615B58daCf164b85F67A56A0c29818A7486f1',
  },
  ensDnsRegistrar: {
    address: '0xd6D15eE266376eBb2C61bEa07Bd1f94b60d33E44',
  },
  ensDnssecImpl: {
    address: '0x28F15B034f9744d43548ac64DCE04ed77BdBd832',
  },
  ensEthRegistrarController: {
    address: '0x88fa401201AAEAC81A41328702CEE34b1dde13db',
  },
  ensNameWrapper: {
    address: '0x5C8c5e4E8cdd36439197EC1c8a1832CB8186bEA1',
  },
  ensPublicResolver: {
    address: '0x806d1eb5FAB72B1F6D7CAd2d1C4959145f5cE001',
  },
  ensRegistry: {
    address: '0x82D6247c272Ae0AB7AA2946ee688e74dAB976c67',
  },
  ensReverseRegistrar: {
    address: '0x625479950cB2947442eb8a81450F15F9B496664a',
  },
  ensUniversalResolver: {
    address: '0xbfBBFcd69651303A65D91741500C008631A9D8a0',
  },
}
