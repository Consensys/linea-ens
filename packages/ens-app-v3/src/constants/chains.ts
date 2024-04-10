import { Chain, holesky } from 'viem/chains'
import { goerli, localhost, mainnet } from 'wagmi/chains'

import { addEnsContracts } from '@ensdomains/ensjs'
import { CheckedChainWithEns } from '@ensdomains/ensjs/contracts'

import type { Register } from '@app/local-contracts'
import { makeLocalhostChainWithEns } from '@app/utils/chains/makeLocalhostChainWithEns'

import { lineaSepolia, lineaSepoliaEnsAddresses } from './lineaSepolia'
import { sepoliaCustom, sepoliaCustomEnsAddresses } from './sepoliaCustom'

export const deploymentAddresses = JSON.parse(
  process.env.NEXT_PUBLIC_DEPLOYMENT_ADDRESSES || '{}',
) as Register['deploymentAddresses']

export const localhostWithEns = makeLocalhostChainWithEns<typeof localhost>(
  localhost,
  deploymentAddresses,
)
export const mainnetWithEns = addEnsContracts(mainnet)
export const goerliWithEns = addEnsContracts(goerli)
export const holeskyWithEns = addEnsContracts(holesky)

// TODO : Replace with TheGraph on Linea Sepolia
export const lineaSepoliaWithEns = {
  ...lineaSepolia,
  contracts: {
    ...lineaSepolia.contracts,
    ...lineaSepoliaEnsAddresses,
  },
  subgraphs: {
    ens: {
      url: 'https://api.studio.thegraph.com/query/49574/enssepolia/version/latest',
    },
  },
} as unknown as CheckedChainWithEns<Chain>

export const sepoliaWithEns = {
  ...sepoliaCustom,
  contracts: {
    ...sepoliaCustom.contracts,
    ...sepoliaCustomEnsAddresses,
  },
  subgraphs: {
    ens: {
      url: 'https://api.studio.thegraph.com/query/69290/ens-sepolia/version/latest',
    },
  },
} as unknown as CheckedChainWithEns<Chain>

export const chainsWithEns = [
  mainnetWithEns,
  goerliWithEns,
  sepoliaWithEns,
  holeskyWithEns,
  localhostWithEns,
  lineaSepoliaWithEns,
] as const

export const getSupportedChainById = (chainId: number | undefined) => {
  return chainId ? chainsWithEns.find((c) => c.id === chainId) : undefined
}

export type SupportedChain =
  | typeof mainnetWithEns
  | typeof goerliWithEns
  | typeof sepoliaWithEns
  | typeof holeskyWithEns
  | typeof localhostWithEns
  | typeof lineaSepoliaWithEns
