import { useRouter } from 'next/router'
import { Chain } from 'viem'

import { getBaseDomain } from '@app/constants/chains'

interface UseDomainRedirectProps {
  chain?: Chain
  nameDetails: {
    name: string
  }
  isLoading: boolean
  route: string
}

export function useDomainRedirect({
  chain,
  nameDetails,
  isLoading,
  route,
}: UseDomainRedirectProps) {
  const router = useRouter()

  if (!isLoading) {
    const baseDomain = getBaseDomain(chain)
    const nameSplit = nameDetails.name.split('.')

    if (nameSplit.length > 2) {
      // Handle subdomains like sub.name.baseDomain.eth
      const subLabel = nameSplit.slice(0, -2).join('.')
      const domain = nameSplit.slice(-2).join('.')

      if (domain !== `${baseDomain}.eth`) {
        const fixedName = `${subLabel}.${baseDomain}.eth`
        router.push(`/${fixedName}/${route}`)
      }
    } else if (nameSplit.length === 2) {
      // Handle names like name.baseDomain.eth
      const label = nameSplit[0]
      const domain = nameSplit[1]

      if (domain !== baseDomain) {
        const fixedName = `${label}.${baseDomain}.eth`
        router.push(`/${fixedName}/${route}`)
      }
    }
  }
}
