import { NameType } from '@ensdomains/ensjs/dist/types/types'

export type Eth3ldNameSpecifier = 'eth-3ld'

export const getNameType = (name: string): NameType | Eth3ldNameSpecifier => {
  const labels = name.split('.')
  const isDotEth = labels[labels.length - 1] === 'eth'

  if (labels.length === 0) return 'root'
  if (labels.length === 1) {
    if (isDotEth) return 'eth-tld'
    return 'tld'
  }
  if (labels.length === 2) {
    if (isDotEth) return 'eth-2ld'
    return 'other-2ld'
  }
  if (labels.length === 3) {
    if (isDotEth) return 'eth-3ld'
    return 'other-2ld'
  }
  if (isDotEth) return 'eth-subname'
  return 'other-subname'
}
