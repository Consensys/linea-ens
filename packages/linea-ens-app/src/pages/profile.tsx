import type { Hex } from 'viem'
import { useAccount } from 'wagmi'

import ProfileContent from '@app/components/pages/profile/[name]/Profile'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { useDomainRedirect } from '@app/hooks/useDomainRedirect'
import { useInitial } from '@app/hooks/useInitial'
import { useNameDetails } from '@app/hooks/useNameDetails'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { checkDNSName } from '@app/utils/utils'

export default function Page() {
  const router = useRouterWithHistory()
  const _name = router.query.name as string
  const isSelf = router.query.connected === 'true'
  const isViewingExpired = router.query.expired === 'true'

  const initial = useInitial()

  const { address, chain } = useAccount()

  const primary = usePrimaryName({ address: address as Hex })

  const name = isSelf && primary.data?.name ? primary.data.name : _name

  // Skip graph for for initial load and router redirect
  const nameDetails = useNameDetails({ name })
  const { isLoading: detailsLoading, registrationStatus, gracePeriodEndDate } = nameDetails

  const isLoading = detailsLoading || primary.isLoading || initial || !router.isReady

  useDomainRedirect({ chain, nameDetails, isLoading, route: '' })

  if (isViewingExpired && gracePeriodEndDate && gracePeriodEndDate > new Date()) {
    router.push(`/profile/${name}`)
    return null
  }

  if (
    (registrationStatus === 'available' || registrationStatus === 'premium') &&
    !isViewingExpired &&
    !detailsLoading
  ) {
    router.push(`/register/${name}`)
    return null
  }

  const isDNS = checkDNSName(name)
  if (isDNS && registrationStatus === 'notImported') {
    router.push(`/import/${name}`)
    return null
  }

  return (
    <ProfileContent
      {...{
        isSelf,
        isLoading,
        name,
      }}
    />
  )
}
