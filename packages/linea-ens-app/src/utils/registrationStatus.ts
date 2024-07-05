import {
  GetAddressRecordReturnType,
  GetExpiryReturnType,
  GetOwnerReturnType,
  GetPriceReturnType,
  GetWrapperDataReturnType,
} from '@ensdomains/ensjs/public'

import { ParsedInputResult } from '@app/ensJsOverrides/utils/validation'

import { emptyAddress } from './constants'

export type RegistrationStatus =
  | 'invalid'
  | 'registered'
  | 'gracePeriod'
  | 'premium'
  | 'available'
  | 'short'
  | 'imported'
  | 'owned'
  | 'notImported'
  | 'notOwned'
  | 'unsupportedTLD'

export const getRegistrationStatus = ({
  timestamp,
  validation: { isShort, type, is3LD, isLineaDotETH },
  ownerData,
  wrapperData,
  expiryData,
  priceData,
  addrData,
  supportedTLD,
}: {
  timestamp: number
  validation: Partial<
    Omit<ParsedInputResult, 'normalised' | 'isValid'> & {
      is3LD: boolean | undefined
    }
  >
  ownerData?: GetOwnerReturnType
  wrapperData?: GetWrapperDataReturnType
  expiryData?: GetExpiryReturnType
  priceData?: GetPriceReturnType
  addrData?: GetAddressRecordReturnType
  supportedTLD?: boolean | null
}): RegistrationStatus => {
  if (isLineaDotETH && is3LD && isShort) {
    return 'short'
  }

  if (!ownerData && ownerData !== null && !wrapperData) return 'invalid'

  if (!isLineaDotETH && !supportedTLD) {
    return 'unsupportedTLD'
  }

  if (isLineaDotETH && is3LD) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    if (expiryData && expiryData.expiry) {
      const { expiry: _expiry, gracePeriod } = expiryData
      const expiry = new Date(_expiry.date)
      if (expiry.getTime() > timestamp) {
        return 'registered'
      }
      if (expiry.getTime() + gracePeriod * 1000 > timestamp) {
        return 'gracePeriod'
      }
      const { premium } = priceData || { premium: 0n }
      if (premium > 0n) {
        return 'premium'
      }
    }
    return 'available'
  }
  if (ownerData && ownerData.owner !== emptyAddress) {
    if (is3LD) {
      return 'imported'
    }
    return 'registered'
  }
  if (type === 'name' && !is3LD) {
    // more than 2 labels
    return 'notOwned'
  }

  if (
    addrData?.value &&
    addrData.value !== '0x0000000000000000000000000000000000000020' &&
    addrData.value !== emptyAddress
  ) {
    return 'imported'
  }

  return 'notImported'
}
