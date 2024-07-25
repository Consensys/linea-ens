import { useRouter } from 'next/router'
import { Chain } from 'viem'

import { getBaseDomain } from '@app/constants/chains'

interface UseDomainRedirectProps {
  chain?: Chain
  nameDetails: {
    name: string
  }
  isLoading: boolean
}
export function useDomainRedirect(args: UseDomainRedirectProps) {
  const { chain, nameDetails, isLoading } = args
  const router = useRouter()

  if (!isLoading) {
    const baseDomain = getBaseDomain(chain)
    const nameSplit = nameDetails.name.split('.')
    if (nameSplit.length > 1) {
      const label = nameSplit[0]
      const nameDomain = nameSplit[1]

      if (nameDomain !== baseDomain) {
        const fixedName = `${label}.${baseDomain}.eth`
        router.push(`/${fixedName}/register`)
      }
    }
  }
}
