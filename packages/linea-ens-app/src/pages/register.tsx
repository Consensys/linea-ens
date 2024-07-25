import { ReactElement, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'

import RegistrationPoh from '@app/components/pages/profile/[name]/registration/RegistrationPoh'
import { getBaseDomain } from '@app/constants/chains'
import { useInitial } from '@app/hooks/useInitial'
import { useNameDetails } from '@app/hooks/useNameDetails'
import { getSelectedIndex } from '@app/hooks/useRegistrationReducer'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { ContentGrid } from '@app/layouts/ContentGrid'

export default function Page() {
  const router = useRouterWithHistory()
  // Derive name from query or path
  const name =
    (router.query.name as string) || router.asPath.replace('/register', '').replace('/', '')

  const initial = useInitial()

  const { address } = useAccount()
  const chainId = useChainId()
  const { chain } = useAccount()

  const nameDetails = useNameDetails({ name })
  const { isLoading: detailsLoading, registrationStatus } = nameDetails

  const isLoading = detailsLoading || initial

  const baseDomain = getBaseDomain(chain)
  const nameSplit = nameDetails.name.split('.')
  const label = nameSplit[0]
  const nameDomain = nameSplit[1]
  const fixedName = `${label}.${baseDomain}.eth`

  useEffect(() => {
    if (!isLoading) {
      // If the selected network does not match the register url we redirect to the correct one
      if (nameSplit.length > 1) {
        if (nameDomain !== baseDomain) {
          router.push(`/${fixedName}/register`)
        }
      }
    }
  }, [nameDomain, baseDomain, isLoading])

  if (!isLoading && registrationStatus !== 'available' && registrationStatus !== 'premium') {
    let redirect = true

    if (nameDetails.ownerData?.owner === address && !!address) {
      const registrationData = JSON.parse(
        localStorage.getItem('registration-status') || '{"items":[]}',
      )
      const index = getSelectedIndex(registrationData, {
        address: address!,
        name: nameDetails.normalisedName,
        chainId,
      })
      if (index !== -1) {
        const { stepIndex, queue } = registrationData.items[index]
        const step = queue[stepIndex]
        if (step === 'transactions' || step === 'complete') {
          redirect = false
        }
      }
    }

    if (redirect) {
      router.push(`/profile/${name}`)
    }
  }

  return <RegistrationPoh {...{ nameDetails, isLoading }} />
}

Page.getLayout = function getLayout(page: ReactElement) {
  return <ContentGrid>{page}</ContentGrid>
}
