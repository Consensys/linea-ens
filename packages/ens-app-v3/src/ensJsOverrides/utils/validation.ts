import { NameWithEmptyLabelsError, RootNameIncludesOtherLabelsError } from '@ensdomains/ensjs'
import {
  checkLabel,
  isEncodedLabelhash,
  Label,
  MINIMUM_DOT_ETH_CHARS,
  normalise,
  saveName,
  split,
} from '@ensdomains/ensjs/utils'

export const validateName = (name: string) => {
  const nameArray = name.split('.')
  const normalisedArray = nameArray.map((label) => {
    if (label.length === 0) throw new NameWithEmptyLabelsError({ name })
    if (label === '[root]') {
      if (name !== label) throw new RootNameIncludesOtherLabelsError({ name })
      return label
    }
    return isEncodedLabelhash(label) ? checkLabel(label) || label : normalise(label)
  })
  const normalisedName = normalisedArray.join('.')
  saveName(normalisedName)
  return normalisedName
}

export type ParsedInputResult = {
  type: 'name' | 'label'
  normalised: string | undefined
  isValid: boolean
  isShort: boolean
  is2LD: boolean
  isETH: boolean
  isLineaDotETH: boolean
  is3LD: boolean
  labelDataArray: Label[]
}

export const parseInput = (input: string): ParsedInputResult => {
  let nameReference = input
  let isValid = false

  try {
    nameReference = validateName(input)
    isValid = true
  } catch {
    // continue regardless of error
  }

  const normalisedName = isValid ? nameReference : undefined

  const labels = nameReference.split('.')
  const tld = labels[labels.length - 1]
  const isETH = tld === 'eth'
  const labelDataArray = split(nameReference)
  const isShort = (labelDataArray[0].output?.length || 0) < MINIMUM_DOT_ETH_CHARS

  if (labels.length === 1) {
    return {
      type: 'label',
      normalised: normalisedName,
      isShort,
      isValid,
      is2LD: false,
      is3LD: false,
      isETH,
      isLineaDotETH: false,
      labelDataArray,
    }
  }

  let isLineaDotETH = false
  if (labels.length > 2 && isETH) {
    const sld = labels[labels.length - 2]
    isLineaDotETH = sld === 'linea'
  }

  const is2LD = labels.length === 2
  const is3LD = labels.length === 3
  return {
    type: 'name',
    normalised: normalisedName,
    isShort: isETH && is3LD ? isShort : false,
    isValid,
    is2LD,
    is3LD,
    isETH,
    isLineaDotETH,
    labelDataArray,
  }
}

export const checkIsDotEth = (labels: string[]) => labels.length === 2 && labels[1] === 'eth'
