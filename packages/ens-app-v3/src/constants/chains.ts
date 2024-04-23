import { Address } from 'viem'
import { Chain, holesky } from 'viem/chains'
import { goerli, localhost, mainnet } from 'wagmi/chains'

import { addEnsContracts } from '@ensdomains/ensjs'

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

const addCustomEnsContracts = <const TChain extends Chain>(
  chain: TChain,
  addresses: EnsAddresses,
  subgraphUrl: string,
) => {
  return {
    ...chain,
    contracts: {
      ...chain.contracts,
      ensRegistry: {
        address: addresses.ensRegistry.address,
      },
      ensUniversalResolver: {
        address: addresses.ensUniversalResolver.address,
      },
      multicall3: {
        address: chain.contracts?.multicall3?.address,
      },
      ensBaseRegistrarImplementation: {
        address: addresses.ensBaseRegistrarImplementation.address,
      },
      ensDnsRegistrar: {
        address: addresses.ensDnsRegistrar.address,
      },
      ensEthRegistrarController: {
        address: addresses.ensEthRegistrarController.address,
      },
      ensNameWrapper: {
        address: addresses.ensNameWrapper.address,
      },
      ensPublicResolver: {
        address: addresses.ensPublicResolver.address,
      },
      ensReverseRegistrar: {
        address: addresses.ensReverseRegistrar.address,
      },
      ensBulkRenewal: {
        address: addresses.ensBulkRenewal.address,
      },
      ensDnssecImpl: {
        address: addresses.ensDnssecImpl.address,
      },
    },
    subgraphs: {
      ens: {
        url: subgraphUrl,
      },
    },
  } as const
}

export const sepoliaWithEns = addCustomEnsContracts(
  sepoliaCustom,
  sepoliaCustomEnsAddresses,
  'https://api.studio.thegraph.com/query/69290/ens-sepolia/version/latest',
)

// TODO : Replace with TheGraph on Linea Sepolia
export const lineaSepoliaWithEns = addCustomEnsContracts(
  lineaSepolia,
  lineaSepoliaEnsAddresses,
  'https://api.studio.thegraph.com/query/49574/enssepolia/version/latest',
)

// export const chainsWithEns = [
//   mainnetWithEns,
//   goerliWithEns,
//   sepoliaWithEns,
//   holeskyWithEns,
//   localhostWithEns,
//   lineaSepoliaWithEns,
// ] as const

export const chainsWithEns = [lineaSepoliaWithEns, sepoliaWithEns, localhostWithEns] as const

export const getSupportedChainById = (chainId: number | undefined) => {
  return chainId ? chainsWithEns.find((c) => c.id === chainId) : undefined
}

export type SupportedChain =
  | typeof localhostWithEns
  | typeof lineaSepoliaWithEns
  | typeof sepoliaWithEns

type EnsAddresses = {
  ensRegistry: {
    address: Address
  }
  ensUniversalResolver: {
    address: Address
  }
  ensBaseRegistrarImplementation: {
    address: Address
  }
  ensDnsRegistrar: {
    address: Address
  }
  ensEthRegistrarController: {
    address: Address
  }
  ensNameWrapper: {
    address: Address
  }
  ensPublicResolver: {
    address: Address
  }
  ensReverseRegistrar: {
    address: Address
  }
  ensBulkRenewal: {
    address: Address
  }
  ensDnssecImpl: {
    address: Address
  }
}
