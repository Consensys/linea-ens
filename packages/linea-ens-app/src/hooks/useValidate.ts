import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

import { getBaseDomain } from '@app/constants/chains'
import { ParsedInputResult, parseInput } from '@app/ensJsOverrides/utils/validation'
import { Prettify } from '@app/types'
import { tryBeautify } from '@app/utils/beautify'

import { useQueryOptions } from './useQueryOptions'

export type ValidationResult = Prettify<
  Partial<Omit<ParsedInputResult, 'normalised' | 'labelDataArray'>> & {
    name: string
    beautifiedName: string
    isNonASCII: boolean | undefined
    labelCount: number
    labelDataArray: ParsedInputResult['labelDataArray']
  }
>

const tryDecodeURIComponent = (input: string) => {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

export const validate = (input: string, baseDomain: unknown) => {
  const decodedInput = tryDecodeURIComponent(input)
  const { normalised: name, ...parsedInput } = parseInput(decodedInput, baseDomain)
  const isNonASCII = parsedInput.labelDataArray.some((dataItem) => dataItem.type !== 'ASCII')
  const outputName = name || input

  return {
    ...parsedInput,
    name: outputName,
    beautifiedName: tryBeautify(outputName),
    isNonASCII,
    labelCount: parsedInput.labelDataArray.length,
  }
}

const defaultData = Object.freeze({
  name: '',
  beautifiedName: '',
  isNonASCII: undefined,
  labelCount: 0,
  type: undefined,
  isValid: undefined,
  isShort: undefined,
  is2LD: undefined,
  is3LD: undefined,
  isETH: undefined,
  isLineaDotETH: undefined,
  labelDataArray: [],
})

type UseValidateParameters = {
  input: string
  enabled?: boolean
}

const tryValidate = (input: string, baseDomain: unknown) => {
  if (!input) return defaultData
  try {
    return validate(input, baseDomain)
  } catch {
    return defaultData
  }
}

export const useValidate = ({ input, enabled = true }: UseValidateParameters): ValidationResult => {
  const { chain } = useAccount()
  const { queryKey } = useQueryOptions({
    params: { input },
    functionName: 'validate',
    queryDependencyType: 'independent',
    keyOnly: true,
  })

  const { data, error } = useQuery({
    queryKey,
    queryFn: ({ queryKey: [params] }) => validate(params.input, getBaseDomain(chain)),
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    select: (d) =>
      Object.fromEntries(
        Object.entries(d).map(([k, v]) => [k, v === 'undefined' ? '' : v]),
      ) as ValidationResult,
  })

  return data || (error ? defaultData : tryValidate(input, getBaseDomain(chain)))
}
