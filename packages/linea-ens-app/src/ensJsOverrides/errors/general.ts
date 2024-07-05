import { BaseError } from '@ensdomains/ensjs'
import { NameType } from '@ensdomains/ensjs/dist/types/types'

import { Eth3ldNameSpecifier } from '../utils/getNameType'

export class UnsupportedNameTypeError extends BaseError {
  nameType: NameType | Eth3ldNameSpecifier

  supportedTypes: (NameType | Eth3ldNameSpecifier)[]

  override name = 'UnsupportedNameTypeError'

  constructor({
    nameType,
    supportedNameTypes,
    details,
  }: {
    nameType: NameType | Eth3ldNameSpecifier
    supportedNameTypes: (NameType | Eth3ldNameSpecifier)[]
    details?: string
  }) {
    super(`Unsupported name type: ${nameType}`, {
      metaMessages: [`- Supported name types: ${supportedNameTypes.join(', ')}`],
      details,
    })
    this.nameType = nameType
    this.supportedTypes = supportedNameTypes
  }
}
