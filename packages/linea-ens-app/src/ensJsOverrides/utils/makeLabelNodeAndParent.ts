import { labelhash } from 'viem'

import { namehash } from '@ensdomains/ensjs/utils'

export const makeLabelNodeAndParent = (name: string) => {
  const labels = name.split('.')
  const label = labels.shift() as string
  const parentNode = namehash(labels.join('.'))
  return {
    label,
    labelhash: labelhash(label),
    parentNode,
  }
}
