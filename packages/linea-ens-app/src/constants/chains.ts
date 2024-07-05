import { Address } from 'viem'
import { Chain } from 'viem/chains'
import { localhost, mainnet } from 'wagmi/chains'

import { addEnsContracts } from '@ensdomains/ensjs'

import type { Register } from '@app/local-contracts'
import { makeLocalhostChainWithEns } from '@app/utils/chains/makeLocalhostChainWithEns'

import { lineaSepolia, lineaSepoliaEnsAddresses } from './lineaSepolia'

export const deploymentAddresses = JSON.parse(
  process.env.NEXT_PUBLIC_DEPLOYMENT_ADDRESSES || '{}',
) as Register['deploymentAddresses']

export const localhostWithEns = makeLocalhostChainWithEns<typeof localhost>(
  localhost,
  deploymentAddresses,
)
// TODO: Replace by linea mainnet after deployment is done
export const mainnetWithEns = addEnsContracts(mainnet)

const addCustomEnsContracts = <const TChain extends Chain>(
  chain: TChain,
  addresses: EnsAddresses,
  subgraphUrl: string,
  baseDomain: string,
  pohVerifierUrl: string,
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
    custom: { baseDomain, pohVerifierUrl },
  } as const
}

export const lineaSepoliaWithEns = addCustomEnsContracts(
  lineaSepolia,
  lineaSepoliaEnsAddresses,
  'https://api.studio.thegraph.com/proxy/69290/ens-linea-sepolia/version/latest',
  'linea-sepolia',
  'https://linea-poh-api-verifier.sepolia.linea.build',
)

export const chainsWithEns = [lineaSepoliaWithEns, localhostWithEns] as const

export const getSupportedChainById = (chainId: number | undefined) => {
  return chainId ? chainsWithEns.find((c) => c.id === chainId) : undefined
}

export const getBaseDomain = (chain?: Chain) => {
  return chain?.custom?.baseDomain ? chain.custom.baseDomain : 'linea-sepolia'
}

export type SupportedChain = typeof localhostWithEns | typeof lineaSepoliaWithEns

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
