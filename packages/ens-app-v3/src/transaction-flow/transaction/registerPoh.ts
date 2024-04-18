import type { TFunction } from 'react-i18next'

import registerPoh from '@app/ensJsOverrides/registerPoh'
import { RegistrationParameters } from '@app/ensJsOverrides/utils/registerPohHelpers'
import { Transaction, TransactionDisplayItem, TransactionFunctionParameters } from '@app/types'
import { secondsToYears } from '@app/utils/utils'

type Data = RegistrationParameters

const displayItems = (
  { name, duration }: Data,
  t: TFunction<'translation', undefined>,
): TransactionDisplayItem[] => [
  {
    label: 'name',
    value: name,
    type: 'name',
  },
  {
    label: 'action',
    value: t('transaction.description.registerPoh'),
  },
  {
    label: 'duration',
    value: t(secondsToYears(duration) > 1 ? 'unit.years_other' : 'unit.years_one', {
      count: secondsToYears(duration),
    }),
  },
]

const transaction = async ({ connectorClient, data }: TransactionFunctionParameters<Data>) => {
  return registerPoh.makeFunctionData(connectorClient, {
    ...data,
  })
}

export default { displayItems, transaction } satisfies Transaction<Data>
