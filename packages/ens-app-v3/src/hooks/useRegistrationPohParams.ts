import { useMemo } from 'react'
import { Address, Hex } from 'viem'

import { ChildFuseReferenceType } from '@ensdomains/ensjs/utils'

import { profileRecordsToRecordOptions } from '@app/components/pages/profile/[name]/registration/steps/Profile/profileRecordUtils'
import { RegistrationReducerDataItem } from '@app/components/pages/profile/[name]/registration/types'
import { RegistrationParameters } from '@app/ensJsOverrides/utils/registerPohHelpers'
import { yearsToSeconds } from '@app/utils/utils'

type Props = {
  name: string
  owner: Address
  registrationData: Pick<
    RegistrationReducerDataItem,
    | 'years'
    | 'resolverAddress'
    | 'secret'
    | 'records'
    | 'clearRecords'
    | 'permissions'
    | 'reverseRecord'
  >
  pohSignature: Hex | undefined
}

const useRegistrationPohParams = ({ name, owner, registrationData, pohSignature }: Props) => {
  const registrationParams: RegistrationParameters = useMemo(
    () => ({
      name,
      owner,
      duration: yearsToSeconds(registrationData.years),
      resolverAddress: registrationData.resolverAddress,
      secret: registrationData.secret,
      records: profileRecordsToRecordOptions(
        registrationData.records,
        registrationData.clearRecords,
      ),
      fuses: {
        named: registrationData.permissions
          ? (Object.keys(registrationData.permissions).filter(
              (key) => !!registrationData.permissions?.[key as ChildFuseReferenceType['Key']],
            ) as ChildFuseReferenceType['Key'][])
          : [],
        unnamed: [],
      },
      reverseRecord: registrationData.reverseRecord,
      signature: pohSignature,
    }),
    [owner, name, registrationData, pohSignature],
  )

  return registrationParams
}

export default useRegistrationPohParams
