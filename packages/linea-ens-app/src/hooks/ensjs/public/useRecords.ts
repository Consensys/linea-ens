import { QueryFunctionContext, useQuery } from '@tanstack/react-query'

import { getRecords, GetRecordsParameters, GetRecordsReturnType } from '@ensdomains/ensjs/public'

import { useQueryOptions } from '@app/hooks/useQueryOptions'
import { ConfigWithEns, CreateQueryKey, PartialBy, QueryConfig } from '@app/types'
import { getIsCachedData } from '@app/utils/getIsCachedData'
import { prepareQueryOptions } from '@app/utils/prepareQueryOptions'

type UseRecordsParameters<
  TTexts extends readonly string[] | undefined = undefined,
  TCoins extends readonly (string | number)[] | undefined = undefined,
  TContentHash extends boolean = false,
  TAbi extends boolean = false,
> = PartialBy<GetRecordsParameters<TTexts, TCoins, TContentHash, TAbi>, 'name'>

type UseRecordsConfig<
  TTexts extends readonly string[] | undefined = undefined,
  TCoins extends readonly (string | number)[] | undefined = undefined,
  TContentHash extends boolean = false,
  TAbi extends boolean = false,
> = QueryConfig<GetRecordsReturnType<TTexts, TCoins, TContentHash, TAbi> | null, Error>

type QueryKey<
  TTexts extends readonly string[] | undefined = undefined,
  TCoins extends readonly (string | number)[] | undefined = undefined,
  TContentHash extends boolean = false,
  TAbi extends boolean = false,
> = CreateQueryKey<
  UseRecordsParameters<TTexts, TCoins, TContentHash, TAbi>,
  'getRecords',
  'standard'
>

export const getRecordsQueryFn =
  (config: ConfigWithEns) =>
  async <
    TTexts extends readonly string[] | undefined = undefined,
    TCoins extends readonly (string | number)[] | undefined = undefined,
    TContentHash extends boolean = false,
    TAbi extends boolean = false,
  >({
    queryKey: [{ name, ...params }, chainId],
  }: QueryFunctionContext<QueryKey<TTexts, TCoins, TContentHash, TAbi>>) => {
    if (!name) throw new Error('name is required')

    const client = config.getClient({ chainId })
    const res = await getRecords(client, {
      name,
      ...params,
    })
    if (!res) return null
    return res
  }

export const useRecords = <
  const TTexts extends readonly string[] | undefined = undefined,
  const TCoins extends readonly (string | number)[] | undefined = undefined,
  const TContentHash extends boolean = false,
  const TAbi extends boolean = false,
>({
  // config
  enabled = true,
  gcTime,
  staleTime,
  scopeKey,
  // params
  ...params
}: UseRecordsParameters<TTexts, TCoins, TContentHash, TAbi> &
  UseRecordsConfig<TTexts, TCoins, TContentHash, TAbi>) => {
  const initialOptions = useQueryOptions({
    params,
    scopeKey,
    functionName: 'getRecords',
    queryDependencyType: 'standard',
    queryFn: getRecordsQueryFn,
  })

  const preparedOptions = prepareQueryOptions({
    queryKey: initialOptions.queryKey,
    queryFn: initialOptions.queryFn,
    enabled: enabled && !!params.name,
    gcTime,
    staleTime,
  })

  const query = useQuery(preparedOptions)

  return {
    ...query,
    refetchIfEnabled: preparedOptions.enabled ? query.refetch : () => {},
    isCachedData: getIsCachedData(query),
  }
}
