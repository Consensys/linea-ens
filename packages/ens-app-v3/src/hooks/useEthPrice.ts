import { Address } from 'viem'
import { useAccount, useReadContract } from 'wagmi'
import { sepolia } from 'wagmi/chains'

import { useAddressRecord } from './ensjs/public/useAddressRecord'

const ORACLE_ENS = 'eth-usd.data.eth'
const ORACLE_SEPOLIA = '0x6602e482072b60Cc8CceFf214102640aa13D44EB' as const

export const useEthPrice = () => {
  const { chainId } = useAccount()

  const { data: address_ } = useAddressRecord({
    name: ORACLE_ENS,
    enabled: chainId !== sepolia.id,
  })

  const address =
    chainId === sepolia.id ? ORACLE_SEPOLIA : (address_?.value as Address) || undefined

  return useReadContract({
    abi: [
      {
        inputs: [],
        name: 'latestAnswer',
        outputs: [{ name: '', type: 'int256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    address,
    functionName: 'latestAnswer',
  })
}
